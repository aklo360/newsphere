# NewSphere Agent Rules

- This is the registered `newsphere` umbrella session root. Load only this file and `.codex/memories.md` as project startup context.
- `web/` is the NewSphere application, `cli/` is the OpenGFX agent/CLI surface, and `site/` is a separate site surface. Keep their ownership boundaries explicit.
- Select the relevant child from the user request before editing. Child instructions and history are on-demand references, not startup context for the umbrella room.
- Never combine identities, deployment targets, secrets, or release workflows across child surfaces.
- Do not commit, push, deploy, publish, spend, or contact anyone without AKLO's explicit instruction.
