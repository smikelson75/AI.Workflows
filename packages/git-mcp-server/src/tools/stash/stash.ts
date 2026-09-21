import type { GitExecutor } from "../../git/executor.js";
import type {
  GitStashInput,
  GitStashResult,
  GitStashEntry,
  GitStashConflict,
} from "../../models/workspace.js";

export const GIT_STASH_TOOL_DEFINITION = {
  name: "git_stash",
  description:
    "Saves dirty working-tree state to a stash, lists stash entries, pops a stash back cleanly, or drops unneeded stash entries.",
  inputSchema: {
    type: "object" as const,
    properties: {
      repo_path: {
        type: "string",
        description: "Absolute path to the target Git repository.",
      },
      action: {
        type: "string",
        enum: ["list", "push", "pop", "drop"],
        description: "Stash operation to perform.",
      },
      include_untracked: {
        type: "boolean",
        description: "When true with action 'push', includes untracked files in the stash.",
      },
      stash_index: {
        type: "number",
        description: "Stash index (0-based) for 'pop' and 'drop' actions. Defaults to 0.",
      },
    },
    required: ["repo_path", "action"],
  },
};

/**
 * Lists stash entries with index, branch, and message.
 */
async function listStashes(executor: GitExecutor, cwd?: string): Promise<GitStashEntry[]> {
  const result = await executor.exec(["stash", "list", "--format=%(refname)|%(subject)"], { cwd });

  return result.stdout
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line, index) => {
      const [refname, subject] = line.split("|");
      // refname format is refs/stash and subject is the message
      const message = subject || refname;
      // Extract branch from the message format "WIP on <branch>: <commit-hash> <message>"
      // or fallback to the full message
      const branchMatch = message.match(/^WIP on (.+?):/);
      const branch = branchMatch ? branchMatch[1] : "unknown";
      return {
        index,
        branch,
        message,
      };
    });
}

/**
 * Pushes current working-tree and index changes to a stash.
 */
async function pushStash(
  executor: GitExecutor,
  includeUntracked?: boolean,
  cwd?: string,
): Promise<{ stash_id: string; message: string }> {
  const args = ["stash", "push"];
  if (includeUntracked) {
    args.push("-u");
  }

  const result = await executor.exec(args, { cwd });

  // Parse output like "Saved working directory and index state On main: <message>"
  // or "No local changes to save" (error case)
  const lines = result.stdout.trim().split("\n");
  const message = lines[0] || "";

  if (message.includes("No local changes to save")) {
    throw new Error("No local changes to save to stash.");
  }

  // Verify the stash was created by listing
  const listResult = await executor.exec(["stash", "list", "-n", "1"], { cwd });
  const firstLine = listResult.stdout.split("\n")[0] || "";
  const stashIdMatch = firstLine.match(/^(stash@\{\d+\})/);
  const stash_id = stashIdMatch ? stashIdMatch[1] : "stash@{0}";

  return { stash_id, message };
}

/**
 * Parses conflict status from git status output.
 */
function parseConflictStatus(statusOutput: string): GitStashConflict[] {
  const conflicts: GitStashConflict[] = [];
  const lines = statusOutput.split("\n");

  for (const line of lines) {
    // Git status conflict format: "UU file.txt", "AA file.txt", etc.
    const match = line.match(/^([UUAADD]{2}) (.+)$/);
    if (match) {
      const statusCode = match[1];
      const path = match[2];
      let status = "";

      if (statusCode === "UU") status = "both modified";
      else if (statusCode === "AA") status = "both added";
      else if (statusCode === "DD") status = "both deleted";
      else if (statusCode === "UD") status = "added by us";
      else if (statusCode === "DU") status = "deleted by them";
      else if (statusCode === "UA") status = "added by them";
      else if (statusCode === "AU") status = "added by us";
      else status = statusCode;

      conflicts.push({ path, status });
    }
  }

  return conflicts;
}

/**
 * Pops a stash entry and applies it to the working tree.
 */
async function popStash(
  executor: GitExecutor,
  stashIndex: number,
  cwd?: string,
): Promise<{ success: boolean; conflicts?: GitStashConflict[] }> {
  const stashRef = `stash@{${stashIndex.toString()}}`;

  try {
    await executor.exec(["stash", "pop", stashRef], { cwd });
    return { success: true };
  } catch (error) {
    // Check if it's a conflict error by examining status
    const statusResult = await executor.exec(["status", "--porcelain"], { cwd });

    // Parse conflicts from status output
    const conflicts = parseConflictStatus(statusResult.stdout);

    // Verify conflict status (look for conflict markers)
    const hasConflicts = conflicts.length > 0 || statusResult.stdout.includes("UU");

    if (hasConflicts) {
      return { success: false, conflicts };
    }

    // Re-throw if it's a different error
    throw error;
  }
}

/**
 * Drops a stash entry without applying it.
 */
async function dropStash(executor: GitExecutor, stashIndex: number, cwd?: string): Promise<void> {
  const stashRef = `stash@{${stashIndex.toString()}}`;
  await executor.exec(["stash", "drop", stashRef], { cwd });
}

/**
 * Executes git_stash: lists, pushes, pops, or drops stash entries.
 */
export async function executeGitStash(
  executor: GitExecutor,
  input: GitStashInput,
): Promise<GitStashResult> {
  const action = input.action;
  const cwd = input.repo_path;

  switch (action) {
    case "list": {
      const entries = await listStashes(executor, cwd);
      return {
        action: "list",
        entries,
      };
    }
    case "push": {
      const { stash_id, message } = await pushStash(executor, input.include_untracked, cwd);
      return {
        action: "push",
        stash_id,
        message,
      };
    }
    case "pop": {
      const stashIndex = input.stash_index ?? 0;
      const { success, conflicts } = await popStash(executor, stashIndex, cwd);
      return {
        action: "pop",
        stash_index: stashIndex,
        success,
        conflicts,
      };
    }
    case "drop": {
      const stashIndex = input.stash_index ?? 0;
      await dropStash(executor, stashIndex, cwd);
      return {
        action: "drop",
        stash_index: stashIndex,
      };
    }
  }
}
