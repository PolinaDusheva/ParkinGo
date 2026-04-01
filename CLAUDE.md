# ParkinGo

Community-driven, crowd-sourced real-time parking app for Varna, Bulgaria.
Expo (React Native) · TypeScript · react-native-maps · Firebase/Supabase · Expo Router · Zustand

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native with Expo (Expo Go for dev) |
| Language | TypeScript (strict) |
| Maps | react-native-maps (Apple Maps on iOS, Google Maps on Android) |
| Location | expo-location (foreground + background) |
| Navigation | Expo Router |
| State | Zustand or React Context |
| Backend | Firebase (Firestore + Auth) or Supabase (Postgres + Realtime + Auth) |
| Map Data | OpenStreetMap via Overpass API |
| Real-time | Firestore listeners or Supabase Realtime |

## References

- `MVP.md` — feature scope, implementation order, data models, acceptance criteria
- `plan.md` — original product concept and vision
- For DB schema/collections: check `MVP.md` data models or query the backend directly — live data > static docs

## Agent Behavior

IMPORTANT: You are a staff-level engineer. Every decision should reflect that.

- **Simplicity first.** Minimal code impact. Smallest change that solves the problem.
- **Find root cause.** No band-aids, no `// TODO: fix later`, no workarounds. Fix it properly or explain why you can't.
- **Only touch what's necessary.** If a file isn't relevant to the task, don't modify it.
- **Read before writing.** Before editing any file, read it first. Before creating a component, check if a similar one exists. Before adding a dependency, check `package.json`.
- **One example > 100 words.** When a similar pattern exists in the codebase, follow it. Check existing components, hooks, stores, and utils before creating new ones.

## Task Tracking

IMPORTANT: Always track your work with tasks. No exceptions.

- **Before starting work:** Create a task list of everything that needs to be done. Break features into concrete, checkable items.
- **As you work:** Mark each task as `completed` the moment you finish it — not in a batch at the end. If the user asks for 1 out of 3 tasks, complete that one, mark it done, and leave the others as pending.
- **Task granularity:** Each task should represent a single deliverable unit (e.g., "create auth screens", "add spot marking logic", "wire up real-time listener") — not an entire feature.
- **Keep it visible:** The task list is your progress tracker. The user should be able to see at a glance what's done, what's in progress, and what's left.
- **Never skip this.** Even for small tasks. If you're doing work, there's a task for it.

## Planning

- Enter **plan mode** for any task that touches 3+ files or involves architectural decisions.
- If implementation diverges from plan or you hit unexpected complexity: **STOP. Re-plan.** Do not push through broken assumptions.
- After planning, state what you will do and what you will NOT touch.

## Context Management

IMPORTANT: Context is your most precious resource. Protect it aggressively.

- Use subagents for research, codebase exploration, and multi-file reads. Only the summary returns to main context.
- `/compact` proactively at ~50% context usage. Don't wait until degradation.
- One focused task per session. If the user switches topics, suggest `/clear`.
- Never `@`-import entire files into CLAUDE.md. Use path references instead.

## Verification

IMPORTANT: Never mark a task done without proving it works.

- Build the app after any change that touches types, imports, or exports.
- Lint after every file edit.
- If a component was changed, verify it renders (check for missing imports, broken props).
- Test on both iOS simulator and Android emulator when touching platform-specific code (maps, location, permissions).
- Ask yourself: *"Would this pass code review from a staff engineer?"*

## Bug Fixing

- When given a bug: reproduce → diagnose → fix → verify. Don't ask for hand-holding.
- Read error logs/stack traces first. Point at the actual failure before proposing a fix.
- If you can't reproduce the bug, say so — don't guess at fixes.

## Code Standards

- Functional components only. No class components.
- Named exports for components. Default exports only for screens/pages.
- Co-locate: component + its types + its hooks in the same directory when scoped.
- Prefer Zustand selectors over full store subscriptions.
- Database queries go in dedicated hooks or a `lib/` layer — never inline in components.
- Type everything. No `any`. No `as` casts unless absolutely necessary with a comment explaining why.
- Platform-specific code uses `Platform.select()` or `.ios.ts` / `.android.ts` file extensions.

## Documentation

- After any structural change (new screens, components, hooks, stores, removed features): update project docs. Stale docs = wrong assumptions next session.
- After corrections from the user: record the lesson so the mistake isn't repeated.

## Don'ts

- Don't install new dependencies without asking first.
- Don't refactor code unrelated to the current task.
- Don't create abstractions for things used only once.
- Don't add comments that restate what the code does. Comment *why*, not *what*.
- Don't use `console.log` for debugging in committed code. Use proper error handling.
