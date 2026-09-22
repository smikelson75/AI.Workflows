# Sources:
# - ../../../prd/verification-mcp-server-prd.md
# - phase.md

Feature: Deterministic reads of workflow artifacts from an explicit repository root
  A caller names a repository and a workflow artifact and receives either that
  artifact's machine-readable fields or a fail-closed rejection that identifies
  exactly which artifact and field is at fault. Nothing is inferred, and nothing
  is guessed from prose.

  @qa-p05-001 @integration
  Scenario: The verification package is installable and verifiable from a clean state
    Given a clean checkout of the repository
    When the verification package's install, build, and verification gates are run
    Then all of them succeed with no type, lint, or formatting violations reported

  @qa-p05-002 @integration
  Scenario: A repository root is resolved from a path inside the repository
    Given a repository whose top level contains workflow artifacts
    When a caller supplies the path of a nested directory inside that repository as the repository root
    Then the resolved repository root is the top level of that repository

  @qa-p05-003 @integration
  Scenario: Resolution does not depend on where the caller is running
    Given a repository at a known location
    And a caller running from an unrelated directory
    When the caller supplies that repository's path as the repository root
    Then the resolved repository root is the same as when the caller runs from inside the repository

  @qa-p05-004 @unit
  Scenario: An absent repository root is rejected before anything is executed
    Given a caller that supplies no repository root
    When the caller requests a workflow artifact
    Then the request is rejected with the stable identifier for a missing repository root
    And no external command is executed

  @qa-p05-005 @integration
  Scenario: A repository root that does not exist is rejected
    Given a path that does not exist on disk
    When a caller supplies that path as the repository root
    Then the request is rejected with the stable identifier for a non-existent repository root
    And the rejection names the offending path

  @qa-p05-006 @integration
  Scenario: A repository root that is a file rather than a directory is rejected
    Given a path that refers to an existing file
    When a caller supplies that path as the repository root
    Then the request is rejected with the stable identifier for a repository root that is not a directory
    And the rejection names the offending path

  @qa-p05-007 @integration
  Scenario: A directory outside any repository is rejected
    Given a directory that is not inside any repository
    When a caller supplies that directory as the repository root
    Then the request is rejected with the stable identifier for a path outside a repository
    And the rejection names the offending path

  @qa-p05-008 @unit
  Scenario: Repository roots are reported in a single normalized form
    Given the same repository location expressed with Windows-style and POSIX-style separators
    When each form is supplied as the repository root
    Then both produce the same normalized repository root

  @qa-p05-009 @unit
  Scenario: Every rejection identifier is declared once and is reachable
    Given the set of rejection identifiers the package can emit
    When that set is compared against the declared identifier registry
    Then every emitted identifier is declared
    And the registry contains no duplicate and no unreachable identifier

  @qa-p05-010 @integration
  Scenario: A well-formed phase artifact yields its machine-readable fields
    Given a repository containing a phase artifact with complete frontmatter
    When a caller requests that phase artifact
    Then the declared phase fields are returned with their expected types

  @qa-p05-011 @integration
  Scenario: A well-formed slice artifact yields its machine-readable fields
    Given a repository containing a slice artifact with complete frontmatter
    When a caller requests that slice artifact
    Then the declared slice fields are returned with their expected types
    And the slice's kind, files in scope, and verification commands are among them

  @qa-p05-012 @unit
  Scenario: Machine-readable fields are never derived from the document body
    Given an artifact whose frontmatter and prose body state different values for the same field
    When a caller requests that artifact
    Then the returned field value is the one declared in the frontmatter
    And the document body is returned unchanged

  @qa-p05-013 @integration
  Scenario: An artifact without frontmatter is rejected
    Given an artifact that contains only a prose body
    When a caller requests that artifact
    Then the request is rejected with the stable identifier for missing frontmatter
    And the rejection names the artifact

  @qa-p05-014 @integration
  Scenario: An artifact with unreadable frontmatter is rejected
    Given an artifact whose frontmatter block cannot be parsed
    When a caller requests that artifact
    Then the request is rejected with the stable identifier for unparsable frontmatter
    And the rejection names the artifact

  @qa-p05-015 @integration
  Scenario: An artifact missing a required field is rejected
    Given an artifact whose frontmatter omits a required field
    When a caller requests that artifact
    Then the request is rejected with the stable identifier for a missing required field
    And the rejection names both the artifact and the field

  @qa-p05-016 @integration
  Scenario: An artifact carrying an undeclared field is rejected
    Given an artifact whose frontmatter contains a field outside the declared contract
    When a caller requests that artifact
    Then the request is rejected with the stable identifier for an unknown field
    And the rejection names both the artifact and the field

  @qa-p05-017 @integration
  Scenario: A request for an artifact that does not exist is rejected
    Given a repository containing no artifact for the named phase and slice
    When a caller requests that artifact
    Then the request is rejected with the stable identifier for a missing artifact
    And the rejection names the artifact that was sought

  @qa-p05-018 @e2e
  Scenario: A caller reads a complete phase and all of its slices
    Given a repository containing a phase artifact and several slice artifacts, all well-formed
    When a caller reads that phase and then each of its slices
    Then every artifact returns its declared machine-readable fields
    And the set of slices returned matches the slices present in that phase

  @qa-p05-019 @e2e
  Scenario: A rejected request leaves the repository unchanged
    Given a repository containing a malformed workflow artifact
    When a caller requests that artifact and the request is rejected
    Then the contents of the repository are unchanged

  @qa-p05-020 @e2e
  Scenario: A caller remains usable after a rejected request
    Given a repository containing both a malformed and a well-formed workflow artifact
    When a caller requests the malformed artifact and is rejected
    And the caller then requests the well-formed artifact
    Then the well-formed artifact returns its declared machine-readable fields
