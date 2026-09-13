# Sources:
# - ../../../prd/git-mcp-server-prd.md
# - phase.md

Feature: Git MCP Server Staging and Mutation Tools
  The Git MCP Server exposes schema-validated staging and mutation tools allowing clients to selectively stage and unstage changes, safely discard working tree modifications, and record staged changes as Conventional Commits, all constrained to the resolved repository root.

  @qa-p03-001 @unit
  Scenario: Path boundary validation rejects traversal outside the repository root
    Given a requested file path that resolves outside the repository root, such as a parent-directory traversal
    When a mutation tool's path validation logic evaluates the requested path
    Then it rejects the path before any Git command is executed

  @qa-p03-002 @unit
  Scenario: Conventional commit message composition from subject, body, and footers
    Given a commit subject, an optional multi-line body, and optional footers
    When the commit message composer assembles the message
    Then it produces a single well-formed multi-line message without shell newline escaping corruption

  @qa-p03-003 @unit
  Scenario: Rejecting invalid or missing mutation tool input options
    Given an agent calls a mutation tool with missing required arguments or malformed options
    When the tool validates the input parameters
    Then it rejects the call with a structured validation error without executing a git command

  @qa-p03-004 @integration
  Scenario: Selectively staging explicit file paths with git_stage
    Given a repository containing multiple modified and untracked files
    When an agent calls the git_stage tool with an explicit list of file paths
    Then only the specified paths appear staged when the agent calls git_status

  @qa-p03-005 @integration
  Scenario: Staging all modified and untracked files with git_stage
    Given a repository containing modified and untracked files
    When an agent calls the git_stage tool with the all option set
    Then every modified and untracked file appears staged when the agent calls git_status

  @qa-p03-006 @integration
  Scenario: Unstaging files without discarding working tree modifications
    Given a repository with staged file modifications
    When an agent calls the git_unstage tool with an explicit list of staged file paths
    Then those paths no longer appear staged while their working tree modifications remain intact

  @qa-p03-007 @integration
  Scenario: Restoring working tree modifications for explicitly named paths
    Given a repository with unstaged working tree modifications to specific files
    When an agent calls the git_restore tool with an explicit list of those file paths
    Then the named files' working tree contents revert to their last indexed state

  @qa-p03-008 @integration
  Scenario: Rejecting broad or wildcard restore requests without explicit confirmation
    Given a repository with multiple unstaged working tree modifications
    When an agent calls the git_restore tool with a broad or wildcard-only path request lacking an explicit confirmation flag
    Then the tool rejects the request and no working tree modifications are discarded

  @qa-p03-009 @integration
  Scenario: Recording staged changes as a Conventional Commit
    Given a repository with staged changes and a commit subject with an optional body and footers
    When an agent calls the git_commit tool
    Then a new commit is created whose message reflects the provided subject, body, and footers

  @qa-p03-010 @integration
  Scenario: Rejecting an empty commit attempt without explicit override
    Given a repository with no staged changes
    When an agent calls the git_commit tool without an explicit empty-commit override
    Then the tool returns a structured error and no commit is created

  @qa-p03-011 @integration
  Scenario: Amending the previous commit
    Given a repository whose most recent commit is amendable and the index contains updated staged changes
    When an agent calls the git_commit tool with the amend option set
    Then the previous commit is replaced with one reflecting the updated staged changes and message

  @qa-p03-012 @e2e
  Scenario: Staging selected paths through the assembled server
    Given an MCP client connected over standard input and output to the Git MCP Server, and a repository with multiple modified files
    When the client calls git_stage for one modified file
    Then the call returns a structured response matching the git_stage output schema and only that file is staged

  @qa-p03-013 @e2e
  Scenario: Unstaging a selected path through the assembled server
    Given an MCP client connected over standard input and output to the Git MCP Server, and a repository with a staged file modification
    When the client calls git_unstage for the staged file
    Then the call returns a structured response matching the git_unstage output schema and the file remains modified but unstaged

  @qa-p03-014 @e2e
  Scenario: Restoring a selected path through the assembled server
    Given an MCP client connected over standard input and output to the Git MCP Server, and a repository with an unstaged file modification
    When the client calls git_restore for the modified file
    Then the call returns a structured response matching the git_restore output schema and the file matches its indexed contents

  @qa-p03-015 @e2e
  Scenario: Committing staged changes through the assembled server
    Given an MCP client connected over standard input and output to the Git MCP Server, and a repository with staged changes
    When the client calls git_commit with a Conventional Commit subject
    Then the call returns a structured response matching the git_commit output schema and the repository contains the new commit
