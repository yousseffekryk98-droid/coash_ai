# Security Audit Runbook

Use this checklist for security reviews and release gates.

## Architecture Prompt

Act as a Senior Cyber Security Engineer specializing in HIPAA and GDPR compliance for Health-Tech SaaS. Review this React/Supabase architecture for:
- RLS isolation across medical/hormonal data
- Service role key leakage
- Input sanitization in user-generated text
- Encryption and storage practices for sensitive logs
- RBAC for coach/admin/client boundaries

## Critical Controls

1. RLS and Relationship Isolation
- Clients can read/write only their own logs.
- Coaches can read only assigned active clients through coaching_relationships.
- Food DB write access is admin-only.

2. Auth Hardening
- Coach access requires verified email.
- JWT-backed Supabase session required for all table access.
- MFA should be enabled at project auth settings.

3. Frontend Hardening
- CSP is set in index.html.
- Service role key is blocked in frontend runtime.
- Sensitive medical fields are not cached in localStorage/sessionStorage.
- User-generated note content is sanitized before persistence.

4. Privacy and Compliance
- Data minimization: capture only required health fields.
- Right-to-be-forgotten via delete_my_account_data() RPC.
- Supabase encryption at rest should be verified in project settings.

## SQL Verification Commands

- Confirm RLS enabled:
  select tablename, rowsecurity from pg_tables where schemaname = 'public';

- Confirm policy coverage:
  select schemaname, tablename, policyname, roles, cmd from pg_policies where schemaname = 'public';

- Validate relationship isolation test:
  Attempt cross-client select while authenticated as a different client (should return zero rows).

## Secrets Rule

Never expose SUPABASE_SERVICE_ROLE_KEY in frontend or VITE_ prefixed variables.
Only use VITE_SUPABASE_ANON_KEY on the client.
