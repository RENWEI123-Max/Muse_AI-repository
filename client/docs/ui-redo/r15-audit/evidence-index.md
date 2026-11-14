# R15 截图与流程证据索引

每张 PNG 来自 Playwright 实际点击/输入后的浏览器截图。API 全为本地 fixture；不代表真实认证/邮件/重设成功。下列每态均覆盖两个高度、两种语言；verify-resend 按指令留空。

| 状态 | 667 EN | 667 KO | 812 EN | 812 KO |
|---|---|---|---|---|
| welcome | [PNG](667-en-welcome.png) | [PNG](667-ko-welcome.png) | [PNG](812-en-welcome.png) | [PNG](812-ko-welcome.png) |
| terms-unchecked | [PNG](667-en-terms-unchecked.png) | [PNG](667-ko-terms-unchecked.png) | [PNG](812-en-terms-unchecked.png) | [PNG](812-ko-terms-unchecked.png) |
| terms-checked | [PNG](667-en-terms-checked.png) | [PNG](667-ko-terms-checked.png) | [PNG](812-en-terms-checked.png) | [PNG](812-ko-terms-checked.png) |
| signin-empty | [PNG](667-en-signin-empty.png) | [PNG](667-ko-signin-empty.png) | [PNG](812-en-signin-empty.png) | [PNG](812-ko-signin-empty.png) |
| signin-filled | [PNG](667-en-signin-filled.png) | [PNG](667-ko-signin-filled.png) | [PNG](812-en-signin-filled.png) | [PNG](812-ko-signin-filled.png) |
| signin-invalid | [PNG](667-en-signin-invalid.png) | [PNG](667-ko-signin-invalid.png) | [PNG](812-en-signin-invalid.png) | [PNG](812-ko-signin-invalid.png) |
| signup-empty | [PNG](667-en-signup-empty.png) | [PNG](667-ko-signup-empty.png) | [PNG](812-en-signup-empty.png) | [PNG](812-ko-signup-empty.png) |
| signup-filled | [PNG](667-en-signup-filled.png) | [PNG](667-ko-signup-filled.png) | [PNG](812-en-signup-filled.png) | [PNG](812-ko-signup-filled.png) |
| signup-mismatch | [PNG](667-en-signup-mismatch.png) | [PNG](667-ko-signup-mismatch.png) | [PNG](812-en-signup-mismatch.png) | [PNG](812-ko-signup-mismatch.png) |
| verify-empty | [PNG](667-en-verify-empty.png) | [PNG](667-ko-verify-empty.png) | [PNG](812-en-verify-empty.png) | [PNG](812-ko-verify-empty.png) |
| verify-error | [PNG](667-en-verify-error.png) | [PNG](667-ko-verify-error.png) | [PNG](812-en-verify-error.png) | [PNG](812-ko-verify-error.png) |
| verify-resend | 未执行／待 Smith（禁止重发） | 未执行／待 Smith（禁止重发） | 未执行／待 Smith（禁止重发） | 未执行／待 Smith（禁止重发） |
| forgot-empty | [PNG](667-en-forgot-empty.png) | [PNG](667-ko-forgot-empty.png) | [PNG](812-en-forgot-empty.png) | [PNG](812-ko-forgot-empty.png) |
| recovery-code | [PNG](667-en-recovery-code.png) | [PNG](667-ko-recovery-code.png) | [PNG](812-en-recovery-code.png) | [PNG](812-ko-recovery-code.png) |
| new-password | [PNG](667-en-new-password.png) | [PNG](667-ko-new-password.png) | [PNG](812-en-new-password.png) | [PNG](812-ko-new-password.png) |
| new-password-error | [PNG](667-en-new-password-error.png) | [PNG](667-ko-new-password-error.png) | [PNG](812-en-new-password-error.png) | [PNG](812-ko-new-password-error.png) |
| apple-private | [PNG](667-en-apple-private.png) | [PNG](667-ko-apple-private.png) | [PNG](812-en-apple-private.png) | [PNG](812-ko-apple-private.png) |
| apple-share | [PNG](667-en-apple-share.png) | [PNG](667-ko-apple-share.png) | [PNG](812-en-apple-share.png) | [PNG](812-ko-apple-share.png) |
| auth-privacy | [PNG](667-en-auth-privacy.png) | [PNG](667-ko-auth-privacy.png) | [PNG](812-en-auth-privacy.png) | [PNG](812-ko-auth-privacy.png) |

## 每套真实走查顺序

### 667 en
[请求、滚动、文本与样式记录](667-en-walkthrough.json)

[welcome](667-en-welcome.png) → [terms-unchecked](667-en-terms-unchecked.png) → [terms-scrolled](667-en-terms-scrolled.png) → [terms-checked](667-en-terms-checked.png) → [consent-privacy](667-en-consent-privacy.png) → [signin-empty](667-en-signin-empty.png) → [signin-filled](667-en-signin-filled.png) → [signin-invalid](667-en-signin-invalid.png) → [signin-api-failure](667-en-signin-api-failure.png) → [signup-empty](667-en-signup-empty.png) → [signup-filled](667-en-signup-filled.png) → [signup-mismatch](667-en-signup-mismatch.png) → [signup-mismatch-scrolled](667-en-signup-mismatch-scrolled.png) → [auth-privacy](667-en-auth-privacy.png) → [verify-empty](667-en-verify-empty.png) → [verify-error](667-en-verify-error.png) → [verify-back-signup](667-en-verify-back-signup.png) → [forgot-empty](667-en-forgot-empty.png) → [forgot-validation](667-en-forgot-validation.png) → [recovery-code](667-en-recovery-code.png) → [new-password](667-en-new-password.png) → [new-password-error](667-en-new-password-error.png) → [password-back-signin](667-en-password-back-signin.png) → [apple-private](667-en-apple-private.png) → [apple-share](667-en-apple-share.png) → [apple-cancel](667-en-apple-cancel.png) → [signin-session](667-en-signin-session.png) → [R06 首页边界](667-en-r06-boundary.png)

### 667 ko
[请求、滚动、文本与样式记录](667-ko-walkthrough.json)

[welcome](667-ko-welcome.png) → [terms-unchecked](667-ko-terms-unchecked.png) → [terms-scrolled](667-ko-terms-scrolled.png) → [terms-checked](667-ko-terms-checked.png) → [consent-privacy](667-ko-consent-privacy.png) → [signin-empty](667-ko-signin-empty.png) → [signin-filled](667-ko-signin-filled.png) → [signin-invalid](667-ko-signin-invalid.png) → [signin-api-failure](667-ko-signin-api-failure.png) → [signup-empty](667-ko-signup-empty.png) → [signup-filled](667-ko-signup-filled.png) → [signup-mismatch](667-ko-signup-mismatch.png) → [signup-mismatch-scrolled](667-ko-signup-mismatch-scrolled.png) → [auth-privacy](667-ko-auth-privacy.png) → [verify-empty](667-ko-verify-empty.png) → [verify-error](667-ko-verify-error.png) → [verify-back-signup](667-ko-verify-back-signup.png) → [forgot-empty](667-ko-forgot-empty.png) → [forgot-validation](667-ko-forgot-validation.png) → [recovery-code](667-ko-recovery-code.png) → [new-password](667-ko-new-password.png) → [new-password-error](667-ko-new-password-error.png) → [password-back-signin](667-ko-password-back-signin.png) → [apple-private](667-ko-apple-private.png) → [apple-share](667-ko-apple-share.png) → [apple-cancel](667-ko-apple-cancel.png) → [signin-session](667-ko-signin-session.png) → [R06 首页边界](667-ko-r06-boundary.png)

### 812 en
[请求、滚动、文本与样式记录](812-en-walkthrough.json)

[welcome](812-en-welcome.png) → [terms-unchecked](812-en-terms-unchecked.png) → [terms-scrolled](812-en-terms-scrolled.png) → [terms-checked](812-en-terms-checked.png) → [consent-privacy](812-en-consent-privacy.png) → [signin-empty](812-en-signin-empty.png) → [signin-filled](812-en-signin-filled.png) → [signin-invalid](812-en-signin-invalid.png) → [signin-api-failure](812-en-signin-api-failure.png) → [signup-empty](812-en-signup-empty.png) → [signup-filled](812-en-signup-filled.png) → [signup-mismatch](812-en-signup-mismatch.png) → [signup-mismatch-scrolled](812-en-signup-mismatch-scrolled.png) → [auth-privacy](812-en-auth-privacy.png) → [verify-empty](812-en-verify-empty.png) → [verify-error](812-en-verify-error.png) → [verify-back-signup](812-en-verify-back-signup.png) → [forgot-empty](812-en-forgot-empty.png) → [forgot-validation](812-en-forgot-validation.png) → [recovery-code](812-en-recovery-code.png) → [new-password](812-en-new-password.png) → [new-password-error](812-en-new-password-error.png) → [password-back-signin](812-en-password-back-signin.png) → [apple-private](812-en-apple-private.png) → [apple-share](812-en-apple-share.png) → [apple-cancel](812-en-apple-cancel.png) → [signin-session](812-en-signin-session.png) → [R06 首页边界](812-en-r06-boundary.png)

### 812 ko
[请求、滚动、文本与样式记录](812-ko-walkthrough.json)

[welcome](812-ko-welcome.png) → [terms-unchecked](812-ko-terms-unchecked.png) → [terms-scrolled](812-ko-terms-scrolled.png) → [terms-checked](812-ko-terms-checked.png) → [consent-privacy](812-ko-consent-privacy.png) → [signin-empty](812-ko-signin-empty.png) → [signin-filled](812-ko-signin-filled.png) → [signin-invalid](812-ko-signin-invalid.png) → [signin-api-failure](812-ko-signin-api-failure.png) → [signup-empty](812-ko-signup-empty.png) → [signup-filled](812-ko-signup-filled.png) → [signup-mismatch](812-ko-signup-mismatch.png) → [signup-mismatch-scrolled](812-ko-signup-mismatch-scrolled.png) → [auth-privacy](812-ko-auth-privacy.png) → [verify-empty](812-ko-verify-empty.png) → [verify-error](812-ko-verify-error.png) → [verify-back-signup](812-ko-verify-back-signup.png) → [forgot-empty](812-ko-forgot-empty.png) → [forgot-validation](812-ko-forgot-validation.png) → [recovery-code](812-ko-recovery-code.png) → [new-password](812-ko-new-password.png) → [new-password-error](812-ko-new-password-error.png) → [password-back-signin](812-ko-password-back-signin.png) → [apple-private](812-ko-apple-private.png) → [apple-share](812-ko-apple-share.png) → [apple-cancel](812-ko-apple-cancel.png) → [signin-session](812-ko-signin-session.png) → [R06 首页边界](812-ko-r06-boundary.png)
