
---
name: testing-code-review
description: Write, run and review automated tests for the Helpdesk backend. Use when implementing features or reviewing code.
---

# Testing and Code Review

## Testing Principles

- Test business behavior, not implementation details.
- Cover successful scenarios.
- Cover validation errors.
- Cover unauthorized requests.
- Cover forbidden requests.
- Cover role-based access.
- Cover database interactions.
- Use isolated test data.
- Never run destructive tests against the shared development database.

## Code Review Checklist

### Architecture
- Are responsibilities separated?
- Are controllers thin?
- Is business logic in services?
- Is dependency injection used correctly?

### Security
- Is input validated?
- Are permissions enforced?
- Are secrets protected?
- Are sensitive fields excluded from responses?

### Database
- Are relations correct?
- Are queries efficient?
- Are transactions needed?
- Are indexes appropriate?

### Quality
- Is TypeScript strict?
- Are names understandable?
- Is unnecessary duplication avoided?
- Are tests meaningful?

## Final Report

For every review, report:

1. Critical issues
2. Major issues
3. Minor issues
4. Suggested improvements
5. Test results

Never claim tests passed unless they were actually executed.
