# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (main branch) | ✅ |
| Older commits | ❌ |

## Reporting a Vulnerability

**Please do not open public GitHub issues for security vulnerabilities.**

If you discover a security issue in the BBQS platform, please report it responsibly:

1. **Email**: Send a detailed report to the project maintainers via the consortium's internal channels.
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We aim to acknowledge reports within **48 hours** and provide a resolution timeline within **5 business days**.

## Security Architecture

### Authentication & Authorization

- **Authentication** is handled by Supabase Auth with Globus OAuth integration, restricted to consortium-affiliated email domains.
- **Row-Level Security (RLS)** is enforced on all 33+ database tables. No table allows unrestricted public access to sensitive data.
- **Edge Functions** follow a tiered access model:
  - **Tier 1** — Public (read-only data endpoints)
  - **Tier 2** — Authenticated (requires valid Supabase JWT)
  - **Tier 3** — Admin-only (role-verified server-side)

### Data Protection

- PII fields (emails, contact info) are excluded from anonymous-accessible views via dedicated PostgreSQL views (e.g., `public_jobs`).
- Edit history and audit logs are restricted to authenticated users.
- All metadata mutations are tracked with full provenance (who, what, when, context).

### Input Validation

- Server-side validation is enforced across all Edge Functions via a shared `_shared/validation.ts` utility.
- Protections include path traversal prevention, regex-validated identifiers, and strict payload size limits for LLM-backed endpoints.

### Error Handling

- Edge Functions return generic error messages (`"Internal server error"`) to prevent information leakage via stack traces.

### External Link Sanitization

- URLs referencing external services (e.g., ORCID) are validated with exact hostname matching to prevent URL spoofing.

### OAuth Security

- The Globus OAuth flow validates `redirect_uri` against a server-side allowlist.

## Environment & Secrets

- **Supabase anon/publishable keys** are committed in `.env` — these are safe by design as security is enforced via RLS, not key secrecy.
- **Private keys and secrets** (API keys, service-role keys) are stored exclusively in Supabase Edge Function secrets and are never committed to the repository.

## Compliance

This project maintains a security posture aligned with **SOC2 Trust Services Criteria** (CC6.1, CC6.8, CC8.1). An internal audit report is maintained and updated as security controls evolve.

## Security Tooling

- **GitHub CodeQL** — Automated static analysis on every pull request
- **Supabase Linter** — Database security policy verification
- **Playwright E2E Tests** — Smoke and visual regression tests to catch UI-level regressions

## Disclosure Policy

We follow **coordinated disclosure**. After a fix is deployed, we will:

1. Credit the reporter (unless anonymity is requested)
2. Publish a summary of the issue and fix in the project changelog
3. Update relevant RLS policies or Edge Functions as needed
