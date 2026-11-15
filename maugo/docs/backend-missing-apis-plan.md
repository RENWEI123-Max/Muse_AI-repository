# Backend missing APIs implementation plan

Spec: `/Users/anna/task-backend-missing-apis.md`; baseline `5925716`.
Only change `maugo/`; retain contracts, migrations, database settings and SMTP configuration.

1. Save full baseline test evidence before implementation.
2. Extend inbox tests for preference booleans/friends filtering and read → unread → read, including persisted NULL. Add block/profile 403 and resend/old-code regression tests. Add isolated database/API likes tests for both content kinds, counts, viewer serialization, idempotency, visibility and stats. Run before implementation to establish failures for missing capabilities.
3. Add `markUnread` action to the existing preference route. Add four authenticated like routes using existing visibility predicates and existing tables. Enrich every post/card serializer and public profile cards with viewer-specific like state and integer total counts. Do not change moderation or auth production code.
4. Run focused tests, TypeScript build and final full suite outside the sandbox, using the existing tmux session. Compare every failure with baseline evidence. Review diff against all five contracts.
5. Write result with exact pass/fail counts, limitations and evidence; commit only backend files, push requested branch and verify remote SHA and clean tree.

Review focus: private/self card rules, both directions of blocking, per-viewer liked values, idempotent mutations, unchanged waiting preferences.
