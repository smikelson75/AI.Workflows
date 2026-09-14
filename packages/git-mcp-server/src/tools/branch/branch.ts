import type { GitExecutor } from "../../git/executor.js";
import type { GitBranchEntry, GitBranchInput, GitBranchResult } from "../../models/workspace.js";

export const GIT_BRANCH_TOOL_DEFINITION = {
  name: "git_branch",
  description:
    "Lists local and remote branches with the current branch indicated, creates new branches, or safely deletes existing branches.",
  inputSchema: {
    type: "object" as const,
    properties: {
      repo_path: {
        type: "string",
        description:
          "Path to the repository root or working directory. Defaults to the server default directory.",
      },
      action: {
        type: "string",
        enum: ["list", "create", "delete"],
        description: "Branch operation to perform.",
      },
      name: {
        type: "string",
        description: "Branch name for 'create' or 'delete' actions.",
      },
      force: {
        type: "boolean",
        description: "When true with action 'delete', force-deletes an unmerged branch.",
      },
    },
    required: ["action"],
  },
};

// Printable characters disallowed by git-check-ref-format(1) for branch names.
const INVALID_BRANCH_NAME_PRINTABLE_CHARS = /[ ~^:?*[\\]/;

/**
 * Validates a branch name against Git's ref naming rules (see git-check-ref-format(1)).
 */
export function isValidBranchName(name: string): boolean {
  if (name.length === 0) {
    return false;
  }
  if (name.startsWith("/") || name.endsWith("/")) {
    return false;
  }
  if (name.startsWith(".") || name.endsWith(".")) {
    return false;
  }
  if (name.endsWith(".lock")) {
    return false;
  }
  if (name.includes("..") || name.includes("//")) {
    return false;
  }
  if (name.includes("@{") || name === "@") {
    return false;
  }
  if (INVALID_BRANCH_NAME_PRINTABLE_CHARS.test(name)) {
    return false;
  }
  // Reject ASCII control characters and DEL.
  for (let i = 0; i < name.length; i += 1) {
    const code = name.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) {
      return false;
    }
  }
  return true;
}

async function listBranches(executor: GitExecutor, cwd?: string): Promise<GitBranchEntry[]> {
  const result = await executor.exec(
    ["for-each-ref", "--format=%(refname)|%(HEAD)", "refs/heads", "refs/remotes"],
    { cwd },
  );

  return result.stdout
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const [refname, head] = line.split("|");
      const isRemote = refname.startsWith("refs/remotes/");
      const name = refname.replace(/^refs\/(heads|remotes)\//, "");
      return {
        name,
        is_current: head === "*",
        is_remote: isRemote,
      };
    })
    .filter((entry) => !entry.name.endsWith("/HEAD"));
}

/**
 * Executes git_branch: lists, creates, or safely deletes branches.
 */
export async function executeGitBranch(
  executor: GitExecutor,
  input: GitBranchInput,
): Promise<GitBranchResult> {
  const cwd = input.repo_path;

  if (input.action === "list") {
    const branches = await listBranches(executor, cwd);
    const current = branches.find((branch) => branch.is_current && !branch.is_remote);
    return {
      action: "list",
      branches,
      current_branch: current?.name ?? null,
    };
  }

  const name = input.name;
  if (name === undefined || !isValidBranchName(name)) {
    throw new Error(
      `Invalid branch name: '${String(name)}' does not conform to Git ref naming rules.`,
    );
  }

  if (input.action === "create") {
    await executor.exec(["branch", "--", name], { cwd });
    return { action: "create", name };
  }

  const branches = await listBranches(executor, cwd);
  const target = branches.find((branch) => branch.name === name && !branch.is_remote);
  if (!target) {
    throw new Error(`Branch '${name}' does not exist and cannot be deleted.`);
  }
  if (target.is_current) {
    throw new Error(`Branch '${name}' is the current branch and cannot be deleted.`);
  }

  const forced = input.force === true;
  await executor.exec(["branch", forced ? "-D" : "-d", "--", name], { cwd });
  return { action: "delete", name, forced };
}
