# Build Enforcement And New-Project Inheritance

Goal: a new project created anywhere under the repository root picks up the shared `.editorconfig` and fails the build on violations, with no per-project setup step.

## Why Directory-Level Files Work

- MSBuild imports the nearest `Directory.Build.props` walking up from each project directory, so properties reach projects that do not exist yet.
- Roslyn resolves `.editorconfig` by directory hierarchy from each source file up to the file marked `root = true`.
- Together they mean the only requirement for a new project is that it lives under the repository root.

## Root `Directory.Build.props`

Write this at the repository root beside `.editorconfig`. Preserve any existing content; merge into the first `PropertyGroup` rather than replacing the file.

```xml
<Project>
  <PropertyGroup>
    <!-- Run IDExxxx code-style rules during build, not only in the IDE -->
    <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
    <EnableNETAnalyzers>true</EnableNETAnalyzers>
    <AnalysisLevel>latest-recommended</AnalysisLevel>
    <AnalysisMode>Recommended</AnalysisMode>
    <CodeAnalysisTreatWarningsAsErrors>true</CodeAnalysisTreatWarningsAsErrors>

    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <LangVersion>latest</LangVersion>
    <GenerateDocumentationFile>true</GenerateDocumentationFile>
  </PropertyGroup>
</Project>
```

Strict variant, only when the user chose it:

```xml
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <AnalysisLevel>latest-all</AnalysisLevel>
    <AnalysisMode>All</AnalysisMode>
    <WarningsNotAsErrors></WarningsNotAsErrors>
```

Legacy-codebase ramp instead of strict: keep `CodeAnalysisTreatWarningsAsErrors` false, keep severities at `warning`, and record the ramp date in a comment.

## Optional Test Relaxation

Place beside the test projects, not at the root:

```xml
<!-- tests/Directory.Build.props -->
<Project>
  <Import Project="$([MSBuild]::GetPathOfFileAbove('Directory.Build.props', '$(MSBuildThisFileDirectory)../'))" />
  <PropertyGroup>
    <GenerateDocumentationFile>false</GenerateDocumentationFile>
  </PropertyGroup>
</Project>
```

The `Import` is required: a nested `Directory.Build.props` stops the upward search unless it imports the parent explicitly.

## New-Project Checklist

Apply whenever a project is added:

1. Project directory is under the repository root — no separate `.editorconfig` or enforcement properties needed.
2. No `EnforceCodeStyleInBuild`, `Nullable`, `TreatWarningsAsErrors`, or analyzer properties in the new `.csproj`; delete them if the template emitted them, because a project-level value overrides the shared one.
3. No `.editorconfig` inside the project directory unless it deliberately overrides a rule; if present, it must not set `root = true`.
4. `dotnet build` on the new project reports the shared analyzer set. If it reports zero style diagnostics on deliberately malformed code, inheritance is broken.

## Verification Commands

| Command | Proves |
| --- | --- |
| `dotnet build -c Release` | Style and analyzer rules run at compile time and violations surface at the agreed severity. |
| `dotnet format --verify-no-changes` | The existing tree already satisfies `.editorconfig`; exits non-zero on drift. |
| `dotnet format --verify-no-changes --severity error` | Narrower gate for a legacy ramp. |
| `dotnet build -c Release /p:TreatWarningsAsErrors=true` | Preview of a strict switch without committing it. |

## Inheritance Smoke Test

To prove enforcement reaches new projects, temporarily add a violating line to any project under the root (for example a field named `Foo` in a private field position) and confirm `dotnet build` reports the naming diagnostic. Remove the line afterwards.

## CI Note

Enforcement lives in the build, so a CI job needs no extra linting step beyond `dotnet build` plus `dotnet format --verify-no-changes`. Do not duplicate rule configuration in CI YAML.
