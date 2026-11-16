# D4 review and verification ledger

Spec/implementation method: supplied approved D1 architecture §1 + §7 D4 and prototype; direct native implementation in user-requested branch and checkout, no additional worktree or approval gate.

- Backend tick test: RED (121-second sample inserted), GREEN (Binance gate 120), npm test 9/9.
- iOS parsing/format/cache/live tests: decimal strings, no client conversion; invalid date, numeric prices, alternate primary rejected; per-user raw JSON roundtrip and path traversal rejection.
- Independent review (d4_review): Important initial viewWillAppear/window guard prevented polling, reproduced by initial screenshot phase with zero rows; moved both controllers to viewDidAppear. Evidence tests now assert first-entry rows and timer interval.
- Independent review: Important fx.stale null accepted, could crash switching SGD. New rejection regression run RED with validator disabled; strict JSON Boolean restored for GREEN.
- Review minor offline fresh banner contradiction corrected; overview implementation-oriented copy replaced with user-facing empty states.
- Ruling: process-restored cache is conservatively stale until a successful fetch because monotonic epochs cannot safely span reboot and wall clock is untrusted. Does not claim restored prices are current. Cached raw JSON is retained without calculation.
- Ruling: iOS Simulator does not expose device data-protection class in file attributes; verify write/read in simulator, retain NSDataWritingFileProtectionComplete and protected directory in product. Hardware encryption behavior remains a device check.
- D5 gap: no /portfolio exists. Overview refreshes only existing own API /me every 60 seconds while visible and on pull; amounts remain unavailable. Wire portfolio/alerts/summary in their scheduled tasks.
- Scope: app composition only changed to select real tab controllers; existing auth/session/API implementation and ATS untouched. No server deployment.
