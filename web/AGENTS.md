# Repository Guidelines

## Project Structure & Module Organization
`src/app` contains App Router pages and API routes such as `src/app/create/page.tsx` and `src/app/api/extract/route.ts`. Shared UI lives in `src/components`, with base primitives under `src/components/ui`. Reusable logic and types are in `src/lib`. Convex backend code is in `convex/`; treat `convex/_generated` as generated output and do not hand-edit it. Static assets belong in `public`, and longer-form product or architecture notes live in `docs`.

## Build, Test, and Development Commands
Use npm in this repository.

- `npm run dev`: start the Next.js dev server.
- `npm run build`: create a production build.
- `npm run start`: serve the built app locally.
- `npm run lint`: run ESLint across the project.
- `npx convex dev`: regenerate Convex types and run the local Convex workflow when backend functions or schema change.

## Coding Style & Naming Conventions
Write TypeScript with strict types and functional React components. Follow the existing style: 2-space indentation, double quotes, semicolons, and Tailwind utility classes inline in JSX. Use `PascalCase` for React components, `camelCase` for functions and variables, and Next.js route filenames like `page.tsx`, `layout.tsx`, and `route.ts`. Prefer the `@/*` import alias for code under `src`.

## Testing Guidelines
There is no automated test runner or coverage gate configured yet. For now, every change should pass `npm run lint` and be manually verified in the affected routes. If you add tests, keep them close to the feature as `*.test.ts` or `*.test.tsx`, and document the command needed to run them in `package.json`.

## Commit & Pull Request Guidelines
Recent commits use short, descriptive subjects such as `Page-aware logo extraction` and `Add Claude skill for NewSphere UI design system`. Keep commit titles concise, imperative, and focused on one change. Pull requests should include a clear summary, note any schema or environment-variable changes, link related issues, and attach screenshots or recordings for UI updates.

## Security & Configuration Tips
Secrets are read from environment variables including `NEXT_PUBLIC_CONVEX_URL`, `GEMINI_API_KEY`, `EXTRACTOR_API_KEY`, `CONVERTKIT_API_KEY`, and `CONVERTKIT_FORM_ID`. Never commit `.env` files or hardcode credentials. When touching extraction or auth flows, verify both the frontend route and the matching Convex/API integration.
