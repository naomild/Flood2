---
name: a11y-pwa-auditing
description: "How to audit Flood's accessibility and PWA quality: axe, Lighthouse, screen readers, real-device install checks. Use before release or when reviewing UI and PWA changes."
user-invocable: false
---
# Accessibility and PWA auditing

## Automated
- `@axe-core/playwright` on home, day detail, console login, chat, proposal diff:
  zero violations.
- Lighthouse: accessibility ≥ 95; PWA installable; no manifest errors.

## Manual (each release)
- VoiceOver (iPhone) and TalkBack (Android): risk word + reason are read for each day;
  offline banner is announced.
- Keyboard-only on desktop; 200 % zoom; 320 px width; light + dark;
  reduced transparency + reduced motion on.
- Install: Android Chrome install prompt → standalone launch; iPhone Share → Add to Home
  Screen → correct icon/name → standalone.
- Airplane mode: app opens with last forecast and its age.
- New deploy picked up on next launch.

Report each check as pass / fail with screenshot or steps to reproduce.
