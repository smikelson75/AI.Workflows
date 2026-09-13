import { GitError } from "../../git/errors.js";
import type { GitExecutor } from "../../git/executor.js";
import type { GitCommit, GitLogInput, GitLogResult } from "../../models/inspection.js";

export const GIT_LOG_TOOL_DEFINITION = {
  name: "git_log",
  description:
    "Retrieves structured commit history records including hash, author metadata, ISO date, subject, body, and changed files with pagination and path filtering.",
  inputSchema: {
    type: "object" as const,
    properties: {
      repo_path: {
        type: "string",
        description:
          "Path to the repository root or working directory. Defaults to the server default directory.",
      },
      max_count: {
        type: "number",
        description: "Maximum number of commits to return.",
      },
      limit: {
        type: "number",
        description: "Alias for max_count.",
      },
      skip: {
        type: "number",
        description: "Number of commits to skip before returning records.",
      },
      revision_range: {
        type: "string",
        description:
          "Commit or revision range to inspect (e.g. 'HEAD~5..HEAD', 'main', 'feature..main').",
      },
      paths: {
        type: "array",
        items: { type: "string" },
        description: "Specific file or directory paths to filter commits.",
      },
      path: {
        type: "string",
        description: "Single file or directory path filter.",
      },
      author: {
        type: "string",
        description: "Limit commits to those by a given author pattern.",
      },
      since: {
        type: "string",
        description: "Show commits more recent than a specific date/time.",
      },
      until: {
        type: "string",
        description: "Show commits older than a specific date/time.",
      },
      oneline: {
        type: "boolean",
        description: "Whether to produce compact log records.",
      },
    },
  },
};

/**
 * Normalizes file paths to use forward slashes and removes surrounding quotes.
 */
function normalizePath(raw: string): string {
  const trimmed = raw.trim();
  const unquoted =
    trimmed.startsWith('"') && trimmed.endsWith('"') ? trimmed.slice(1, -1) : trimmed;
  return unquoted.replace(/\\/g, "/");
}

/**
 * Parses commit stream formatted with ASCII unit/record separators.
 */
function parseDelimitedGitLog(output: string): GitCommit[] {
  const chunks = output.split("\x1e");
  const commits: GitCommit[] = [];

  for (const chunk of chunks) {
    if (!chunk || !chunk.trim()) {
      continue;
    }

    const fields = chunk.split("\x1f");
    if (fields.length >= 7) {
      const hash = fields[0]?.trim() ?? "";
      const shortHash = fields[1]?.trim() ?? hash.slice(0, 7);
      const authorName = fields[2]?.trim() ?? "";
      const authorEmail = fields[3]?.trim() ?? "";
      const date = fields[4]?.trim() ?? "";
      const subject = fields[5]?.trim() ?? "";
      const body = fields[6]?.trim() ?? "";
      const remainder = fields[7] ?? "";

      const filesChanged = remainder
        .split(/\r?\n/)
        .map((l) => normalizePath(l))
        .filter(Boolean);

      const authorFormatted = authorEmail ? `${authorName} <${authorEmail}>` : authorName;

      commits.push({
        hash,
        short_hash: shortHash,
        author: authorFormatted,
        ...(authorName ? { author_name: authorName } : {}),
        ...(authorEmail ? { author_email: authorEmail } : {}),
        date,
        subject,
        body,
        files_changed: filesChanged,
      });
    }
  }

  return commits;
}

/**
 * Parses standard formatted git log output (with commit, Author, Date, indented message, and files).
 */
function parseStandardGitLog(output: string): GitCommit[] {
  const commits: GitCommit[] = [];
  const lines = output.split(/\r?\n/);
  let currentCommit: Partial<GitCommit> | null = null;
  let messageLines: string[] = [];
  let fileLines: string[] = [];
  let readingMessage = false;

  const flushCommit = () => {
    if (currentCommit && currentCommit.hash) {
      const subject = messageLines[0]?.trim() ?? "";
      const body = messageLines.slice(1).join("\n").trim();
      commits.push({
        hash: currentCommit.hash,
        short_hash: currentCommit.short_hash ?? currentCommit.hash.slice(0, 7),
        author: currentCommit.author ?? "",
        ...(currentCommit.author_name ? { author_name: currentCommit.author_name } : {}),
        ...(currentCommit.author_email ? { author_email: currentCommit.author_email } : {}),
        date: currentCommit.date ?? "",
        subject,
        body,
        files_changed: fileLines.map(normalizePath).filter(Boolean),
      });
    }
    currentCommit = null;
    messageLines = [];
    fileLines = [];
    readingMessage = false;
  };

  for (const line of lines) {
    const commitMatch = line.match(/^commit\s+([0-9a-f]{7,40})/);
    if (commitMatch) {
      flushCommit();
      currentCommit = {
        hash: commitMatch[1],
        short_hash: commitMatch[1].slice(0, 7),
      };
      continue;
    }

    if (!currentCommit) {
      continue;
    }

    const authorMatch = line.match(/^Author:\s+(.+?)(?:\s+<([^>]+)>)?$/) as Array<
      string | undefined
    > | null;
    if (authorMatch) {
      const name = authorMatch[1]?.trim() ?? "";
      const email = authorMatch[2]?.trim();
      currentCommit.author_name = name;
      if (email) {
        currentCommit.author_email = email;
        currentCommit.author = `${name} <${email}>`;
      } else {
        currentCommit.author = name;
      }
      continue;
    }

    const dateMatch = line.match(/^Date:\s+(.+)$/) as Array<string | undefined> | null;
    if (dateMatch) {
      currentCommit.date = dateMatch[1]?.trim();
      readingMessage = true;
      continue;
    }

    if (readingMessage) {
      if (line.startsWith("    ")) {
        messageLines.push(line.slice(4));
      } else if (line.trim().length === 0) {
        if (messageLines.length > 0) {
          messageLines.push("");
        }
      } else {
        fileLines.push(line.trim());
      }
    }
  }

  flushCommit();
  return commits;
}

/**
 * Parses Git log output into an array of typed GitCommit objects.
 */
export function parseGitLog(output: string): GitCommit[] {
  if (!output || !output.trim()) {
    return [];
  }

  if (output.includes("\x1e")) {
    return parseDelimitedGitLog(output);
  }

  return parseStandardGitLog(output);
}

/**
 * Executes git log and parses output into structured GitLogResult.
 */
export async function executeGitLog(
  executor: GitExecutor,
  input: GitLogInput = {},
): Promise<GitLogResult> {
  const format = "%x1e%H%x1f%h%x1f%an%x1f%ae%x1f%aI%x1f%s%x1f%b%x1f";
  const args = ["log", `--format=${format}`, "--name-only"];

  const maxCount = input.max_count ?? input.limit;
  if (maxCount !== undefined && maxCount > 0) {
    args.push("-n", String(maxCount));
  }

  if (input.skip !== undefined && input.skip >= 0) {
    args.push(`--skip=${String(input.skip)}`);
  }

  if (input.author) {
    args.push(`--author=${input.author}`);
  }

  if (input.since) {
    args.push(`--since=${input.since}`);
  }

  if (input.until) {
    args.push(`--until=${input.until}`);
  }

  if (input.revision_range) {
    args.push(input.revision_range);
  }

  const filterPaths: string[] = [];
  if (input.paths && Array.isArray(input.paths)) {
    filterPaths.push(...input.paths);
  }
  if (input.path && typeof input.path === "string") {
    filterPaths.push(input.path);
  }
  if (filterPaths.length > 0) {
    args.push("--", ...filterPaths);
  }

  try {
    const res = await executor.exec(args, { cwd: input.repo_path });
    const commits = parseGitLog(res.stdout);
    return {
      commits,
      total: commits.length,
    };
  } catch (error) {
    if (
      error instanceof GitError &&
      (error.stderr.includes("does not have any commits yet") ||
        error.stderr.includes("fatal: your current branch"))
    ) {
      return {
        commits: [],
        total: 0,
      };
    }
    throw error;
  }
}
