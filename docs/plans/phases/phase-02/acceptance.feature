# Sources:
# - ../../../prd/git-mcp-server-prd.md
# - phase.md

Feature: Git MCP Server Repository Inspection and Read-Only Tools
  The Git MCP Server exposes schema-validated, read-only inspection tools allowing clients to query repository metadata, inspect working tree and index status codes, generate diff patches and statistics, and retrieve structured commit logs.

  @qa-p02-001 @unit
  Scenario: Porcelain status parsing into structured status codes and normalized paths
    Given raw porcelain status lines containing staged changes, unstaged changes, and untracked files
    When the status output parser processes the output
    Then it extracts two-character status codes, staged status, unstaged status, and normalized paths

  @qa-p02-002 @unit
  Scenario: Structured commit log parsing
    Given raw formatted git log output containing commit hashes, author metadata, dates, subjects, bodies, and changed files
    When the log parser processes the output
    Then it converts the stream into typed commit objects with each field populated

  @qa-p02-003 @unit
  Scenario: Diff statistics calculation
    Given raw unified diff output containing file modifications, insertions, and deletions
    When the diff parser extracts file statistics
    Then it provides insertion counts, deletion counts, and modified file summaries

  @qa-p02-004 @integration
  Scenario: Querying repository metadata with git_info
    Given a clean Git repository with an active branch and an initial commit
    When an agent calls the git_info tool
    Then the result contains the absolute repository root, active branch name, HEAD commit hash, and indicates the working tree is clean

  @qa-p02-005 @integration
  Scenario: Inspecting working tree and index state with git_status
    Given a repository containing staged modifications, unstaged modifications, and untracked files
    When an agent calls the git_status tool with untracked files set to normal
    Then the result returns structured entries reflecting both index and working tree status codes for each file

  @qa-p02-006 @integration
  Scenario: Generating diff patch and stat views with git_diff
    Given a repository with modified files in the working tree and staged index
    When an agent calls the git_diff tool requesting staged diffs in patch and stat modes
    Then the result returns the unified diff patch and structured insert and delete statistics scoped to staged changes

  @qa-p02-007 @integration
  Scenario: Filtering commit history with git_log pagination and path scoping
    Given a repository with multiple historical commits across several files
    When an agent calls the git_log tool with a maximum count limit and a path filter
    Then the returned commit history is constrained to the specified count and only includes commits touching the specified path

  @qa-p02-008 @integration
  Scenario: Validating tool input parameters against invalid options
    Given an agent calls an inspection tool with missing required arguments or malformed options
    When the tool validates the input parameters
    Then it rejects the call with a structured validation error without executing a git command

  @qa-p02-009 @e2e
  Scenario: End-to-end repository inspection workflow over stdio
    Given an MCP client connected over standard input and output to the Git MCP Server
    When the client lists available tools and executes an inspection sequence across git_info, git_status, git_diff, and git_log
    Then all four tools return structured responses matching their output schemas and accurately reflecting the repository state
