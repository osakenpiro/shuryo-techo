# Shared request book v0.3 — activation handoff

Owner: `osakenpiro/shuryo-techo#3`. Portal receiver: `osakenpiro/claude-shared#326`.
Runtime: GitHub Pages static frontend + Firebase Google Authentication + Firestore.
Production state: **NOT CONFIGURED** (`config.mjs` exports null). A deployed frontend is not a live synchronization service.

## What is implemented

- Four server-bound hunter identities; private reads; owner-only equipment/inventory writes; shared plan writes.
- Server revision checks + client transactions. Competing writes do not silently overwrite. The losing client keeps a draft for export, not a retry queue.
- Explicit own-only migration from the original `mhwi-equipment-requests-v1` record, individual JSON, full backup (own portion only), or initial seed. Original browser records are never changed. Initial osakenpiro seed includes 12 requests and historical screenshot stock; friends are blank. No re-import over existing cloud documents.
- Automatic receive via Firestore snapshot listeners after a deliberate save. Equipment details use a save button; this is synchronization, not keystroke autosaving.
- Memory-only Firestore caching, session-scoped Google authentication, data display cleared on logout or membership revocation. Offline writes stop. On conflict, export the pending draft before closing the page.
- The v0.2 loadout block survives as request memo text. Dedicated 9-slot form has not been ported to this shared surface. Local original remains available. Craig transcription integration remains a different lane.

## Activation prerequisites — do not guess these

1. Owner-approved Firebase project for this personal four-player tool. No university/helpdesk or unrelated project's database/rules may be overwritten.
2. Firebase web app config (public metadata), project ID, Google sign-in provider enabled and `osakenpiro.github.io` as an authorized domain. Never put service-account keys, OAuth client secrets or tokens in web config, this repo, or a public issue.
3. Firestore Native database. The included full rule file is for a **dedicated** project. For an existing shared project, a maintainer must review and merge only the `mhRooms` namespace; do NOT deploy this file wholesale.
4. Four Firebase Auth UIDs, obtained after each person's first sign-in, mapped exactly once to `osakenpiro`, `keuita`, `serket`, `zushi` by the administrator. Do not self-register based on a claimed nickname. Do not publish the UID roster here.

## Admin setup sequence

Using an existing authorized Firebase console/CLI session (not available/used in this chat):

1. Select the approved project and configure Google auth/web app. Create Firestore with restrictive rules, never test-mode public rules.
2. Run tests below. Review rules for the target database. Deploy rules only with the explicit project parameter:

```sh
# Set PROJECT to the owner-approved project ID in your local shell first.
test -n "$PROJECT" || exit 1
firebase deploy --only firestore:rules --project "$PROJECT" --config equipment-wishlist/sync/firebase.json
```

3. Set `config.mjs` to the public web app config and room ID `mh4` only after rules are installed. Shape:

```js
export const sharedConfig = {
  roomId: 'mh4',
  firebase: { /* exact public Firebase web-app configuration from the approved project */ }
};
```

4. Each person signs in. Unregistered users see only their own UID and no shared book. Through the authorized admin console, create exactly four docs under `mhRooms/mh4/members/UID` with `hunterId` set to that person's canonical hunter name and `active: true`. No UI control can create or rewrite membership documents.
5. Verify outsider and owner/friend access against the REAL project, then have each person confirm their own import. Do not seed private user data through public build logs.
6. Test two actual devices: owner changes material quantity and saves; friend sees it; friend cannot alter owner's book; both can alter agenda; a stale concurrent write leaves a draft; membership revocation stops access. Only then mark production sync ACTIVE.

To revoke access, the administrator sets `active: false` or deletes that member doc. The rules reject subsequent reads/writes immediately; the member listener clears the UI. Data already seen/copied cannot be revoked retroactively.

## Data schema

- `mhRooms/{room}/members/{uid}` → `{hunterId, active}` (admin-managed, clients read only their own membership).
- `mhRooms/{room}/hunters/{hunterId}` → `{schema:1, revision, content, updatedBy, updatedAt}`. `content` is validated JSON for one legacy-compatible hunter record. Security rules protect ownership and envelope; the browser validates the payload. Owner's field contents are not trusted HTML.
- `mhRooms/{room}/plans/today` → same envelope; content is a plan array. The plan document is shared by all four.
- No raw audio/transcript, emails or auth secrets in these content documents.

## Reproducible tests

Node 22 + Java 21. Demo project only; no credentials or billing.

```sh
cd equipment-wishlist/sync
npm install --ignore-scripts --no-audit --no-fund
npm run test:core
npm run test:rules
```

The emulator is bound to localhost:8180 and project `demo-mh-wishlist`; never a production project. Unit tests use the actual client revision function; emulator tests cover nonmember denial, owner-only writes, shared agenda, role-escalation denial, same-room scoping, two-client listeners, stale concurrent writes, migration overwrite prevention, and revocation. Google popup login and production IAM are not emulator test results.

Direct dependency versions are pinned; a package lock should be generated and reviewed before the next dependency upgrade.

## Primary references reviewed

- https://firebase.google.com/docs/firestore/manage-data/transactions
- https://firebase.google.com/docs/firestore/security/rules-conditions
- https://firebase.google.com/docs/firestore/query-data/listen
- https://firebase.google.com/docs/auth/web/google-signin
- https://firebase.google.com/docs/emulator-suite
- https://firebase.google.com/docs/reference/emulator-suite/rules-unit-testing/rules-unit-testing.testenvironmentconfig

## Scope

Only new `equipment-wishlist/sync/` files, an entry link on the existing equipment page, and a separately scoped read-only CI verification workflow. No portal root, notebook, roadmap, dictionary, or unrelated cloud workload changes. No production Firebase resource, auth provider, membership or billing setting was provisioned by this release.
