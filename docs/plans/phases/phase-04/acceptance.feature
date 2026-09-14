# Sources:
# - ../../../prd/git-mcp-server-prd.md
# - phase.md

Feature: Git MCP Server Branch, Stash, and Full-Lifecycle Workflow
  The Git MCP Server exposes schema-validated workspace isolation tools allowing clients to list, create, and delete branches, and to save, list, apply, and drop stashed work, completing the full 10-tool surface and enabling a complete agent workflow through the assembled server.

  @qa-p04-001 @unit
  Scenario: Branch ref name validation rejects invalid names
    Given a requested branch name that violates Git's ref naming rules
    When the git_branch tool's input validation logic evaluates the requested name for a create action
    Then it rejects the name before any Git command is executed

  @qa-p04-002 @unit
  Scenario: Rejecting invalid or missing git_branch input options
    Given an agent calls git_branch with an unrecognized action or missing required arguments
    When the tool validates the input parameters
    Then it rejects the call with a structured validation error without executing a git command

  @qa-p04-003 @unit
  Scenario: Rejecting invalid or missing git_stash input options
    Given an agent calls git_stash with an unrecognized action or an out-of-range stash index
    When the tool validates the input parameters
    Then it rejects the call with a structured validation error without executing a git command

  @qa-p04-004 @integration
  Scenario: Listing local and remote branches with the current branch indicated
    Given a repository with multiple local branches and one checked-out current branch
    When an agent calls the git_branch tool with the list action
    Then the response contains every local branch with the current branch clearly indicated

  @qa-p04-005 @integration
  Scenario: Creating a new branch
    Given a repository on an existing branch
    When an agent calls the git_branch tool with the create action and a valid new branch name
    Then the new branch appears in a subsequent git_branch list call

  @qa-p04-006 @integration
  Scenario: Deleting an existing non-current branch
    Given a repository with a branch that is not currently checked out
    When an agent calls the git_branch tool with the delete action for that branch
    Then the branch no longer appears in a subsequent git_branch list call

  @qa-p04-007 @integration
  Scenario: Rejecting deletion of the current branch
    Given a repository whose currently checked-out branch is targeted for deletion
    When an agent calls the git_branch tool with the delete action for the current branch
    Then the tool returns a structured error and the branch remains present and checked out

  @qa-p04-008 @integration
  Scenario: Saving dirty working tree state with git_stash push
    Given a repository with uncommitted working tree and staged modifications
    When an agent calls the git_stash tool with the push action
    Then the working tree returns to a clean state and the new entry appears in a subsequent git_stash list call

  @qa-p04-009 @integration
  Scenario: Including untracked files in a stash
    Given a repository with untracked files and the include_untracked option requested
    When an agent calls the git_stash tool with the push action and include_untracked set
    Then the untracked files are captured in the stash and no longer appear as untracked in the working tree

  @qa-p04-010 @integration
  Scenario: Listing stash entries with structured identification
    Given a repository with one or more existing stash entries
    When an agent calls the git_stash tool with the list action
    Then the response contains each entry's index, originating branch, and descriptive message

  @qa-p04-011 @integration
  Scenario: Popping a stash entry cleanly
    Given a repository with a stash entry that applies without conflict
    When an agent calls the git_stash tool with the pop action for that entry
    Then the working tree reflects the stashed changes and the entry no longer appears in a subsequent git_stash list call

  @qa-p04-012 @integration
  Scenario: Popping a stash entry that conflicts with the working tree
    Given a repository with a stash entry that cannot apply cleanly against current working tree contents
    When an agent calls the git_stash tool with the pop action for that entry
    Then the tool returns a structured conflict diagnostic and the stash entry remains available in a subsequent git_stash list call

  @qa-p04-013 @integration
  Scenario: Dropping a stash entry without altering the working tree
    Given a repository with an existing stash entry and a clean working tree
    When an agent calls the git_stash tool with the drop action for that entry
    Then the entry no longer appears in a subsequent git_stash list call and the working tree remains unchanged

  @qa-p04-014 @e2e
  Scenario: Listing branches through the assembled server
    Given an MCP client connected over standard input and output to the Git MCP Server, and a repository with multiple branches
    When the client calls git_branch with the list action
    Then the call returns a structured response matching the git_branch output schema identifying the current branch

  @qa-p04-015 @e2e
  Scenario: Creating and deleting a branch through the assembled server
    Given an MCP client connected over standard input and output to the Git MCP Server, and a repository on an existing branch
    When the client calls git_branch to create a new branch and then calls git_branch to delete that same branch
    Then both calls return structured responses matching the git_branch output schema and the branch is absent from a final git_branch list call

  @qa-p04-016 @e2e
  Scenario: Saving and popping a stash through the assembled server
    Given an MCP client connected over standard input and output to the Git MCP Server, and a repository with uncommitted modifications
    When the client calls git_stash with the push action and then calls git_stash with the pop action for the created entry
    Then both calls return structured responses matching the git_stash output schema and the original modifications are present in the working tree

  @qa-p04-017 @e2e
  Scenario: Malformed workspace tool input is rejected through the assembled server
    Given an MCP client connected over standard input and output to the Git MCP Server
    When the client calls git_branch or git_stash with malformed required arguments
    Then the client receives an invalid-parameters protocol error and no Git command is executed

  @qa-p04-018 @e2e
  Scenario: Unsafe current-branch deletion is rejected without changing repository state
    Given an MCP client connected over standard input and output to the Git MCP Server, and a repository on its current branch
    When the client calls git_branch with the delete action targeting the current branch
    Then the call returns an actionable error and the current branch remains checked out and present

  @qa-p04-019 @e2e
  Scenario: Full agent lifecycle across discover, diff, stage, stash, pop, commit, and log
    Given an MCP client connected over standard input and output to the Git MCP Server, and a repository with uncommitted modifications
    When the client sequentially calls git_info, git_diff, git_stage, git_stash push, git_stash pop, git_commit, and git_log
    Then each call returns a structured response matching its output schema and the final git_log entry reflects the committed changes

  @qa-p04-020 @e2e
  Scenario: Invalid repository requests to workspace tools do not terminate the server
    Given an MCP client connected over standard input and output to the Git MCP Server
    When the client calls git_branch or git_stash for a directory that is not a Git repository
    Then the call returns an actionable repository error and the server accepts a subsequent valid tool call
