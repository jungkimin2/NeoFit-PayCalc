# Repository Guidelines

## Project Structure & Module Organization
NeoFit PayCalc lives under `src/` with CRA defaults. `index.js` mounts `App.js`, while global Tailwind styles sit in `index.css`. Place visual components in `src/components/`; colocate component-specific state and tests nearby. Shared Firebase calls belong in `src/firebase/`—extend `authService.js` or `salesService.js` instead of importing the SDK directly. Static marketing pages, icons, and favicons stay in `public/`. Generated build output goes to `build/`; keep it untracked.

## Build, Test, and Development Commands
`npm install` syncs dependencies, especially after Firebase updates. Run `npm start` for the React dev server with hot reload. Use `npm test` (or `npm test -- --coverage`) to execute the Jest suite. `npm run build` creates the production bundle for deployment handoff.

## Coding Style & Naming Conventions
Follow the `react-app` ESLint baseline; lint locally with `npx eslint src`. Use 2-space indentation, semicolons, and single quotes in JS/JSX files. Components and contexts take PascalCase; hooks, helpers, and util modules use camelCase. Prefix public environment variables with `REACT_APP_`. Order Tailwind classes layout → spacing → color to keep diffs predictable.

## Testing Guidelines
Write component tests alongside implementations as `ComponentName.test.jsx` or under `src/__tests__/`. Use React Testing Library helpers (`screen`, `userEvent`) and mock Firebase calls through the shared services. Target coverage for authentication flows, sales mutations, and chart rendering; add intentional gaps to the PR description if needed.

## Commit & Pull Request Guidelines
Adopt Conventional Commits such as `feat: sales chart tooltip`, keeping scope concise. Group related changes per commit and avoid mixing asset updates unless required. PRs should summarize intent, list validation commands (e.g., `npm test -- --coverage`), and attach UI captures when visuals shift. Cross-link Firebase guides when operator steps change.

## Security & Configuration Notes
Store secrets in `.env.local` and never commit Firebase credentials. Rotate API keys after demos and update `firebase-setup-guide.md`. Sign out between admin sessions and clear browser storage to prevent stale permissions.
