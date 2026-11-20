# CashWise Project Instructions & Agent Guidelines

Project: **CashWise** — Aplikasi Pengatur Keuangan Web & Mobile Hybrid (Local-first + Cloud Sync).

---

## 🧘 Ponytail: The Lazy Senior Developer Rules

> **Core Philosophy:** The best code is the code never written. Solve the whole problem with the least new code.

Before writing or suggesting any code, walk through the **Decision Ladder**:
1. **Does this need to exist?** If no, skip it.
2. **Does the codebase already have it?** Reuse existing utilities, models, and types.
3. **Does the standard library do it?** Use built-in JavaScript/TypeScript/Dart features instead of pulling packages.
4. **Is there a native platform capability?** (e.g., HTML `<input type="date">`, CSS native grid/flex, Flutter native widgets).
5. **Does an installed dependency cover it?** Do not add redundant npm packages or pub packages.
6. **Can it be done simply?** Keep functions concise, straightforward, and readable.
7. *Only then:* Write the bare minimum required code.

**Strict Quality & Safety (No Lazy Shortcuts on Security):**
- Lazy about unnecessary code bloat and over-engineering, but **meticulous** about:
  - Data validation (Zod / strongly-typed models).
  - Security (sanitization, no hardcoded secrets, safe SQL/ORM queries).
  - Error handling (graceful offline fallbacks, comprehensive try-catch).
  - Accessibility (contrast, readable text, screen-reader friendly).

**Response Requirement:**
At the end of technical implementation responses, summarize in 1-2 lines:
- What was skipped or left intentionally minimal.
- Any technical risks or follow-up items the human developer should know.

---

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read `antislop.md` (core) and then the skill for the task:
- UI / visual: `~/.gemini/config/plugins/anti-slop/skills/antislop-ui/SKILL.md`
- Copy & text: `~/.gemini/config/plugins/anti-slop/skills/antislop-copywriting/SKILL.md`
- People: `~/.gemini/config/plugins/anti-slop/skills/antislop-human/SKILL.md`
- Mobile / responsive: `~/.gemini/config/plugins/anti-slop/skills/antislop-layoutmobile/SKILL.md`
- Code comments: `~/.gemini/config/plugins/anti-slop/skills/antislop-code/SKILL.md`

### Anti-Slop Design Directives for CashWise:
- **No generic AI aesthetics:** Never use fuzzy neon gradients, floating purple blobs, meaningless glassmorphism, or cliché placeholder illustrations.
- **Consult `DESIGN.md`:** Always use the defined palette (Navy Slate, Emerald, Coral/Rose, Crisp Neutral).
- **Data clarity first:** Financial numbers must use tabular figures (`font-mono`, aligned right). Income is distinguished by emerald/green, expenses by rose/red.
- **Accessibility:** Minimum 4.5:1 contrast ratio for all text elements.
<!-- antislop:end -->

---

## ⚡ Vercel & Web Guidelines
- Framework: Next.js with App Router.
- Leverage Vercel Serverless and Edge functions for lightweight API endpoints.
- Keep client bundles minimal; prioritize Server Components for static/read-only views and Client Components only for interactive, stateful, or local-first database interactions.
- Preview deployments on feature branches; production builds verified via `npm run build`.

---

## 📱 Mobile (Flutter) & Hybrid Sync Guidelines
- Architecture: Feature-based architecture with clean separation (domain, data, presentation).
- Local Database: SQLite (`sqflite`) for mobile; IndexedDB/Dexie for web.
- Mutasi lokal harus bersifat atomic dan dicatat di antrean `sync_queue`.
- Sinkronisasi idempoten menggunakan UUID dan nomor versi entitas.
