# TypeScript Stack Specifics

- Test framework: Jest.
- Mocking: Jest's built-in APIs, including `jest.fn`, `jest.spyOn`, and `jest.mock` for module mocks.
- Use the repository's existing package manager and test scripts. If Jest is missing, add the smallest repo-consistent Jest setup needed for TypeScript.
- Focused test run during loops; full project test suite before done.