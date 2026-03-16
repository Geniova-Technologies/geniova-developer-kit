# Code Review Rules - BecarIA

## General
- Conventional Commits required (feat:, fix:, refactor:, etc.)
- Max 300 lines changed per PR
- No secrets, API keys, or credentials in code
- No references to AI tools (Claude, Copilot, etc.) in commits or code
- Tests required for all new functionality

## Security (OWASP)
- No XSS vulnerabilities (sanitize user input, escape HTML output)
- No SQL injection (use parameterized queries)
- No command injection (avoid exec with user input, validate args)
- No path traversal (validate file paths, no ../ in user input)
- No hardcoded credentials, tokens, or passwords
- All user input must be validated
- No eval(), new Function(), or dangerous dynamic patterns

## Code Quality
- console.log in production code is a warning (use proper logging)
- No unused variables or imports
- Use const by default, let only when reassignment is needed
- Descriptive naming for variables and functions (English)
- No TypeScript `any` type
- Follow SOLID principles
- Follow DRY principles (no duplicated logic)

## UI/UX
- Never use native alert(), confirm(), prompt()
- Loading states required for async operations
- Error handling with user-friendly messages
- Mobile-first responsive design
- Accessibility: labels on inputs, sufficient contrast, keyboard navigation

## Decision Criteria
- **APPROVE** if: All rules pass, code is clean, tests exist
- **REQUEST_CHANGES** if: Security issues, missing tests, broken patterns, or secrets detected
- Comment format: category (security/quality/style), severity (blocker/warning/suggestion), specific file and line reference
