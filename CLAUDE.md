# CLAUDE.md

## Project context
This repo is a Lovable frontend with a Supabase backend.

Frontend stack:
- React
- Vite
- TypeScript
- Tailwind / shadcn-style components

Backend stack:
- Supabase Postgres
- Supabase Auth
- Row Level Security policies
- Supabase Storage
- Edge Functions where present

## Review priorities
1. Tenant isolation and RLS correctness
2. Auth correctness and session handling
3. Migration safety and schema integrity
4. Frontend correctness, forms, loading/error states
5. Accessibility on interactive UI
6. Query efficiency and overfetching

## Project-specific rules
- Never trust organization_id, role, or permissions from the client if they should be derived server-side.
- Flag any query or mutation that could bypass tenant boundaries.
- Flag missing or overly broad RLS policies.
- Flag service-role usage in client-reachable code paths.
- Flag schema changes that can break existing rows, constraints, or nullability assumptions.
- Flag missing indexes for common joins and tenant-scoped filtering.
- Prefer explicit handling for loading, empty, denied, and error states in UI.
- Treat Lovable-generated code as production code: review for correctness, not aesthetics.
