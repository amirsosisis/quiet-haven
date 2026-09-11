# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Durable product decisions

- The companion and product name is **Eira / Эйра**.
- Eira is always presented as an AI companion, never as a therapist, psychologist, human, relative, or exclusive relationship.
- The core value is a context-aware conversation. Send recent history to the model and answer concrete details before offering advice.
- First-run setup asks for a name, an optional preferred nickname, and one conversation tone. Tone choices include natural, friendly, gentle, light sarcasm, and kind/direct; sarcasm must never target vulnerable feelings.
- Keep the MVP focused: onboarding, conversation, local memory, and existing small rituals. Do not add many personas or modes at once.
- The approved future visual direction is EIRA in restrained black-and-white programmer typography, with an original digit-contour character. Visual effects must remain secondary to readable conversation.
