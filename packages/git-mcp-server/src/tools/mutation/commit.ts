import type { GitExecutor } from "../../git/executor.js";
import type { GitCommitInput, GitCommitResult } from "../../models/mutation.js";

export const GIT_COMMIT_TOOL_DEFINITION = {
  name: "git_commit",
  description:
    "Records staged changes as a Conventional Commit composed from a subject, optional body, and optional footers. Supports 'amend: true' and 'allow_empty: true'.",
  inputSchema: {
    type: "object" as const,
    properties: {
      repo_path: {
        type: "string",
        description:
          "Path to the repository root or working directory. Defaults to the server default directory.",
      },
      subject: {
        type: "string",
        description: "Conventional Commit subject line.",
      },
      body: {
        type: "string",
        description: "Optional commit message body.",
      },
      footers: {
        type: "array",
        items: { type: "string" },
        description: "Optional commit message footer lines, e.g. 'Refs: #123'.",
      },
      amend: {
        type: "boolean",
        description: "When true, amends the previous commit instead of creating a new one.",
      },
      allow_empty: {
        type: "boolean",
        description: "When true, allows creating a commit with no staged changes.",
      },
    },
    required: ["subject"],
  },
};

/**
 * Composes a Conventional Commit message from a subject, optional body, and optional
 * footers, joining each section with a blank line without shell newline escaping.
 */
export function composeCommitMessage(subject: string, body?: string, footers?: string[]): string {
  const sections = [subject];
  if (body !== undefined && body.trim() !== "") {
    sections.push(body);
  }
  if (footers !== undefined && footers.length > 0) {
    sections.push(footers.join("\n"));
  }
  return sections.join("\n\n");
}

/**
 * Executes git_commit: verifies staged changes exist (unless amending or overridden),
 * composes a Conventional Commit message, and creates or amends the commit.
 */
export async function executeGitCommit(
  executor: GitExecutor,
  input: GitCommitInput,
): Promise<GitCommitResult> {
  const amend = input.amend === true;
  const allowEmpty = input.allow_empty === true;

  if (!amend && !allowEmpty) {
    const stagedResult = await executor.exec(["diff", "--cached", "--name-only"], {
      cwd: input.repo_path,
    });
    if (stagedResult.stdout.trim() === "") {
      throw new Error(
        "No staged changes are present. Stage changes first or pass 'allow_empty: true' to override.",
      );
    }
  }

  const message = composeCommitMessage(input.subject, input.body, input.footers);

  const args = ["commit", "-m", message];
  if (amend) {
    args.push("--amend");
  }
  if (allowEmpty) {
    args.push("--allow-empty");
  }

  await executor.exec(args, { cwd: input.repo_path });

  const revParseResult = await executor.exec(["rev-parse", "HEAD"], { cwd: input.repo_path });

  return {
    commit_sha: revParseResult.stdout.trim(),
    subject: input.subject,
    amended: amend,
  };
}
