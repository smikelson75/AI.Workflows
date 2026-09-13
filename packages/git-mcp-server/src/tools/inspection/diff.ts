import { GitError } from "../../git/errors.js";
import type { GitExecutor } from "../../git/executor.js";
import type {
  GitDiffCheckError,
  GitDiffCheckResult,
  GitDiffInput,
  GitDiffMode,
  GitDiffResult,
  GitDiffStatFile,
  GitDiffStatSummary,
} from "../../models/inspection.js";

export const GIT_DIFF_TOOL_DEFINITION = {
  name: "git_diff",
  description:
    "Inspects differences between working tree, staging index, and commit references. Supports patch, stat, name_only, and check modes with path filtering.",
  inputSchema: {
    type: "object" as const,
    properties: {
      repo_path: {
        type: "string",
        description:
          "Path to the repository root or working directory. Defaults to the server default directory.",
      },
      mode: {
        type: "string",
        enum: ["patch", "stat", "name_only", "check"],
        description:
          "Diff output mode: 'patch' (full unified diff), 'stat' (file statistics), 'name_only' (list of changed files), or 'check' (whitespace/conflict checks). Defaults to 'patch'.",
      },
      staged: {
        type: "boolean",
        description:
          "Whether to diff staged changes against HEAD (equivalent to git diff --cached/--staged). Defaults to false.",
      },
      cached: {
        type: "boolean",
        description: "Alias for staged.",
      },
      target: {
        type: "string",
        description:
          "Target commit, branch, or reference to compare against (e.g. 'HEAD~1', 'main').",
      },
      base: {
        type: "string",
        description:
          "Base commit, branch, or reference when comparing two references (e.g. base..target).",
      },
      paths: {
        type: "array",
        items: { type: "string" },
        description: "Specific file or directory paths to filter the diff.",
      },
      path: {
        type: "string",
        description: "Single file or directory path filter.",
      },
      max_lines: {
        type: "number",
        description: "Maximum number of patch lines to return before truncating.",
      },
    },
  },
};

/**
 * Unquotes path strings if surrounded by double quotes.
 */
function unquotePath(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed
      .slice(1, -1)
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\")
      .replace(/\\t/g, "\t")
      .replace(/\\n/g, "\n");
  }
  return trimmed;
}

/**
 * Normalizes file paths to use forward slashes and removes surrounding quotes.
 */
export function normalizePath(raw: string): string {
  return unquotePath(raw).replace(/\\/g, "/");
}

/**
 * Parses raw unified diff output into structured file statistics (insertions, deletions, files changed).
 */
export function parseUnifiedDiffStats(diffText: string): GitDiffStatSummary {
  const lines = diffText.split(/\r?\n/);
  const files: GitDiffStatFile[] = [];
  let currentFile: GitDiffStatFile | null = null;
  let inHunk = false;

  for (const line of lines) {
    if (line.startsWith("diff --git ")) {
      if (currentFile) {
        files.push(currentFile);
      }
      const match = line.match(
        /^diff --git (?:a\/(.+?)|"a\/(.+?)") (?:b\/(.+?)|"b\/(.+?)")$/,
      ) as Array<string | undefined> | null;
      let filePath = "";
      if (match) {
        filePath = match[3] ?? match[4] ?? match[1] ?? match[2] ?? "";
      } else {
        const parts = line.split(" ");
        filePath = (parts[parts.length - 1] ?? "").replace(/^b\//, "");
      }
      currentFile = {
        path: normalizePath(filePath),
        insertions: 0,
        deletions: 0,
      };
      inHunk = false;
      continue;
    }

    if (line.startsWith("Binary files ") && line.includes(" differ")) {
      if (!currentFile) {
        const match = line.match(
          /Binary files (?:a\/(.+?)|"a\/(.+?)") and (?:b\/(.+?)|"b\/(.+?)") differ/,
        ) as Array<string | undefined> | null;
        const filePath = match ? (match[3] ?? match[4] ?? match[1] ?? match[2] ?? "") : "";
        currentFile = {
          path: normalizePath(filePath),
          insertions: 0,
          deletions: 0,
          binary: true,
        };
      } else {
        currentFile.binary = true;
      }
      continue;
    }

    if (line.startsWith("--- ") || line.startsWith("+++ ")) {
      if (line.startsWith("+++ ") && !currentFile) {
        let p = line.slice(4).trim();
        p = p.replace(/^b\//, "");
        if (p !== "/dev/null") {
          currentFile = {
            path: normalizePath(p),
            insertions: 0,
            deletions: 0,
          };
        }
      }
      continue;
    }

    if (line.startsWith("@@ ")) {
      inHunk = true;
      continue;
    }

    if (inHunk && currentFile) {
      if (line.startsWith("+")) {
        currentFile.insertions++;
      } else if (line.startsWith("-")) {
        currentFile.deletions++;
      }
    }
  }

  if (currentFile) {
    files.push(currentFile);
  }

  const insertions = files.reduce((acc, f) => acc + f.insertions, 0);
  const deletions = files.reduce((acc, f) => acc + f.deletions, 0);

  return {
    files_changed: files.length,
    insertions,
    deletions,
    files,
  };
}

/**
 * Parses Git diff --numstat output into structured file statistics.
 */
export function parseNumstat(output: string): GitDiffStatSummary {
  const lines = output.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const files: GitDiffStatFile[] = [];

  for (const line of lines) {
    const parts = line.split("\t");
    if (parts.length >= 3) {
      const insRaw = parts[0]?.trim() ?? "0";
      const delRaw = parts[1]?.trim() ?? "0";
      const pathRaw = parts.slice(2).join("\t").trim();

      const isBinary = insRaw === "-" && delRaw === "-";
      const insertions = isBinary ? 0 : parseInt(insRaw, 10) || 0;
      const deletions = isBinary ? 0 : parseInt(delRaw, 10) || 0;

      files.push({
        path: normalizePath(pathRaw),
        insertions,
        deletions,
        ...(isBinary ? { binary: true } : {}),
      });
    }
  }

  const insertions = files.reduce((acc, f) => acc + f.insertions, 0);
  const deletions = files.reduce((acc, f) => acc + f.deletions, 0);

  return {
    files_changed: files.length,
    insertions,
    deletions,
    files,
  };
}

/**
 * Parses diff statistics from unified diff output or numstat output.
 */
export function parseDiffStat(output: string): GitDiffStatSummary {
  if (!output || !output.trim()) {
    return {
      files_changed: 0,
      insertions: 0,
      deletions: 0,
      files: [],
    };
  }

  if (output.includes("diff --git") || output.includes("@@ ") || output.includes("--- ")) {
    return parseUnifiedDiffStats(output);
  }

  return parseNumstat(output);
}

/**
 * Parses output from git diff --check into structured GitDiffCheckResult.
 */
export function parseDiffCheck(output: string, exitCode?: number): GitDiffCheckResult {
  const lines = output.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const errors: GitDiffCheckError[] = [];

  for (const line of lines) {
    const match = line.match(/^([^:]+?)(?::(\d+))?:\s*(.+)$/) as Array<string | undefined> | null;
    if (match) {
      const filePart = match[1] ?? "";
      const linePart = match[2];
      const messagePart = match[3] ?? "";
      errors.push({
        file: normalizePath(filePart),
        ...(linePart !== undefined ? { line: parseInt(linePart, 10) } : {}),
        message: messagePart.trim(),
      });
    } else {
      errors.push({
        file: "",
        message: line.trim(),
      });
    }
  }

  const hasErrors = errors.length > 0 || (exitCode !== undefined && exitCode !== 0);

  return {
    has_errors: hasErrors,
    errors,
    raw: output.trim() || undefined,
  };
}

/**
 * Executes git diff and returns structured GitDiffResult.
 */
export async function executeGitDiff(
  executor: GitExecutor,
  input: GitDiffInput = {},
): Promise<GitDiffResult> {
  const isStaged = Boolean(input.staged || input.cached);
  const mode: GitDiffMode = input.mode ?? "patch";
  const args = ["diff"];

  if (isStaged) {
    args.push("--staged");
  }

  if (mode === "stat") {
    args.push("--numstat");
  } else if (mode === "name_only") {
    args.push("--name-only");
  } else if (mode === "check") {
    args.push("--check");
  }

  if (input.base && input.target) {
    args.push(input.base, input.target);
  } else if (input.target) {
    args.push(input.target);
  } else if (input.base) {
    args.push(input.base);
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

  if (mode === "check") {
    let checkOutput = "";
    let exitCode = 0;
    try {
      const res = await executor.exec(args, { cwd: input.repo_path });
      checkOutput = res.stdout;
      exitCode = res.exitCode;
    } catch (error) {
      if (error instanceof GitError && error.exitCode !== null && error.exitCode !== 0) {
        checkOutput = (error.stdout ? `${error.stdout}\n` : "") + error.stderr;
        exitCode = error.exitCode;
      } else {
        throw error;
      }
    }
    const checkResult = parseDiffCheck(checkOutput, exitCode);
    return {
      mode: "check",
      staged: isStaged,
      is_clean: !checkResult.has_errors,
      check: checkResult,
    };
  }

  if (mode === "name_only") {
    const res = await executor.exec(args, { cwd: input.repo_path });
    const files = res.stdout
      .split(/\r?\n/)
      .map((l) => normalizePath(l.trim()))
      .filter(Boolean);
    return {
      mode: "name_only",
      staged: isStaged,
      is_clean: files.length === 0,
      files,
    };
  }

  if (mode === "stat") {
    const res = await executor.exec(args, { cwd: input.repo_path });
    const stat = parseDiffStat(res.stdout);
    const files = stat.files.map((f) => f.path);
    return {
      mode: "stat",
      staged: isStaged,
      is_clean: stat.files_changed === 0,
      stat,
      files,
    };
  }

  // mode === "patch"
  const res = await executor.exec(args, { cwd: input.repo_path });
  let patchText = res.stdout;
  let isTruncated = false;

  if (input.max_lines !== undefined && input.max_lines > 0) {
    const lines = patchText.split(/\r?\n/);
    if (lines.length > input.max_lines) {
      patchText =
        lines.slice(0, input.max_lines).join("\n") +
        "\n\n[Diff output truncated: exceeded max_lines limit]";
      isTruncated = true;
    }
  }

  const stat = parseDiffStat(res.stdout);
  const files = stat.files.map((f) => f.path);
  const isClean = res.stdout.trim().length === 0;

  return {
    mode: "patch",
    staged: isStaged,
    is_clean: isClean,
    patch: patchText,
    stat,
    files,
    ...(isTruncated ? { is_truncated: true } : {}),
  };
}
