import type { GitExecutor } from "../../git/executor.js";
import type {
  GitFileStatus,
  GitFileStatusDescription,
  GitStatusInput,
  GitStatusResult,
} from "../../models/inspection.js";

export const GIT_STATUS_TOOL_DEFINITION = {
  name: "git_status",
  description:
    "Retrieves structured working tree and staging area state, including two-character status codes (XY), staged status, unstaged status, and normalized paths.",
  inputSchema: {
    type: "object" as const,
    properties: {
      repo_path: {
        type: "string",
        description:
          "Path to the repository root or working directory. Defaults to the server default directory.",
      },
      untracked_files: {
        type: "string",
        enum: ["all", "normal", "no"],
        description: "Mode for handling untracked files: 'all', 'normal', or 'no'.",
      },
      ignored: {
        type: "boolean",
        description: "Whether to include ignored files in the status output.",
      },
    },
  },
};

/**
 * Maps a single porcelain status code character to its descriptive status.
 */
export function mapStatusCodeChar(char: string): GitFileStatusDescription {
  switch (char) {
    case " ":
    case ".":
      return "unmodified";
    case "M":
      return "modified";
    case "A":
      return "added";
    case "D":
      return "deleted";
    case "R":
      return "renamed";
    case "C":
      return "copied";
    case "U":
      return "unmerged";
    case "?":
      return "untracked";
    case "!":
      return "ignored";
    case "T":
      return "type_changed";
    default:
      return "unknown";
  }
}

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
function normalizePath(raw: string): string {
  return unquotePath(raw).replace(/\\/g, "/");
}

/**
 * Parses Git status porcelain v1 or v2 output lines into structured GitFileStatus items.
 */
export function parsePorcelainStatus(output: string): GitFileStatus[] {
  const lines = output.split(/\r?\n/);
  const items: GitFileStatus[] = [];

  for (const line of lines) {
    if (!line || line.startsWith("#")) {
      continue;
    }

    // Porcelain v2 ordinary change: 1 <XY> <sub> <mH> <mI> <mW> <hH> <hI> <path>
    if (line.startsWith("1 ")) {
      const parts = line.split(" ");
      if (parts.length >= 9) {
        const rawCode = parts[1] ?? "..";
        const statusCode = rawCode.replace(/\./g, " ");
        const pathPart = parts.slice(8).join(" ");
        items.push({
          path: normalizePath(pathPart),
          status_code: statusCode,
          staged_status: mapStatusCodeChar(statusCode[0]),
          unstaged_status: mapStatusCodeChar(statusCode[1]),
        });
      }
      continue;
    }

    // Porcelain v2 rename/copy: 2 <XY> <sub> <mH> <mI> <mW> <hH> <hI> <X><score> <path><tab><origPath>
    if (line.startsWith("2 ")) {
      const parts = line.split(" ");
      if (parts.length >= 10) {
        const rawCode = parts[1] ?? "..";
        const statusCode = rawCode.replace(/\./g, " ");
        const remainder = parts.slice(9).join(" ");
        const [targetPath, origPath] = remainder.includes("\t")
          ? remainder.split("\t")
          : remainder.split(" ");
        items.push({
          path: normalizePath(targetPath),
          status_code: statusCode,
          staged_status: mapStatusCodeChar(statusCode[0]),
          unstaged_status: mapStatusCodeChar(statusCode[1]),
          orig_path: origPath ? normalizePath(origPath) : undefined,
        });
      }
      continue;
    }

    // Porcelain v2 unmerged: u <XY> <sub> <m1> <m2> <m3> <mW> <h1> <h2> <h3> <path>
    if (line.startsWith("u ")) {
      const parts = line.split(" ");
      if (parts.length >= 11) {
        const rawCode = parts[1] ?? "..";
        const statusCode = rawCode.replace(/\./g, " ");
        const pathPart = parts.slice(10).join(" ");
        items.push({
          path: normalizePath(pathPart),
          status_code: statusCode,
          staged_status: "unmerged",
          unstaged_status: "unmerged",
        });
      }
      continue;
    }

    // Porcelain v2 untracked: ? <path>
    if (line.startsWith("? ")) {
      items.push({
        path: normalizePath(line.slice(2)),
        status_code: "??",
        staged_status: "untracked",
        unstaged_status: "untracked",
      });
      continue;
    }

    // Porcelain v2 ignored: ! <path>
    if (line.startsWith("! ")) {
      items.push({
        path: normalizePath(line.slice(2)),
        status_code: "!!",
        staged_status: "ignored",
        unstaged_status: "ignored",
      });
      continue;
    }

    // Porcelain v1 format: XY <path> or XY <origPath> -> <targetPath>
    if (line.length >= 3) {
      const statusCode = line.slice(0, 2);
      const rawPathPart = line.slice(3);

      let path: string;
      let origPath: string | undefined;

      if (rawPathPart.includes(" -> ")) {
        const [origRaw, targetRaw] = rawPathPart.split(" -> ");
        origPath = normalizePath(origRaw);
        path = normalizePath(targetRaw);
      } else {
        path = normalizePath(rawPathPart);
      }

      let stagedStatus: GitFileStatusDescription;
      let unstagedStatus: GitFileStatusDescription;

      if (statusCode === "??") {
        stagedStatus = "untracked";
        unstagedStatus = "untracked";
      } else if (statusCode === "!!") {
        stagedStatus = "ignored";
        unstagedStatus = "ignored";
      } else {
        stagedStatus = mapStatusCodeChar(statusCode[0]);
        unstagedStatus = mapStatusCodeChar(statusCode[1]);
      }

      items.push({
        path,
        status_code: statusCode,
        staged_status: stagedStatus,
        unstaged_status: unstagedStatus,
        ...(origPath ? { orig_path: origPath } : {}),
      });
    }
  }

  return items;
}

/**
 * Executes git status and parses output into structured GitStatusResult.
 */
export async function executeGitStatus(
  executor: GitExecutor,
  input: GitStatusInput = {},
): Promise<GitStatusResult> {
  const args = ["status", "--porcelain=v1"];

  if (input.untracked_files) {
    args.push(`--untracked-files=${input.untracked_files}`);
  }

  if (input.ignored) {
    args.push("--ignored");
  }

  const result = await executor.exec(args, {
    cwd: input.repo_path,
  });

  const entries = parsePorcelainStatus(result.stdout);
  const isClean = entries.filter((e) => e.status_code !== "!!").length === 0;

  return {
    is_clean: isClean,
    entries,
    files: entries,
  };
}
