# Bear

A note taking app in the spirit of [Bear](https://bear.app): three panes, plain
markdown, and hashtags instead of folders. Sign in to keep notes in sync across
devices via Supabase; preferences (theme, font, layout) still live in the
browser's `localStorage`.

```bash
npm install
npm run dev      # http://localhost:5173
```

| Command | Does |
| --- | --- |
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Typecheck and build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Run the unit tests once |
| `npm run test:watch` | Run the tests in watch mode |

## What it does

**Markdown styled as you type.** There is no preview to toggle — the editor
*is* the preview. Headings grow, bold goes bold, code turns monospace, and the
syntax markers recede in colour rather than vanishing, so a note is always
editable plain text. A heading's `#` is the one marker that folds away
completely: it comes back the moment the cursor lands on that line, so the
heading still reads as a heading the rest of the time. Built on CodeMirror 6
with a custom highlight style, live todo checkboxes and inline tag pills. A
formatting toolbar covers the common shortcuts when muscle memory fails.

**Hashtags, not folders.** Write `#work` anywhere in a note and it appears in
the sidebar. Tags nest with a slash (`#work/projects/bear`), and parent tags
count everything filed underneath them. Spaces are allowed if you close the tag
with a second hash: `#reading list#`. Tags inside code spans, fenced blocks and
URLs are left alone. Renaming a tag rewrites every note that uses it, including
nested children; removing one strips the hashtag and keeps the prose.

**Everything else you would expect.** Full-text and `#tag` search, pinning,
smart lists (Todo / Today / Untagged), archive, trash with restore, duplicate,
markdown and HTML export, JSON backup and import, light and dark themes,
sans/serif/mono editor fonts with adjustable size, and a keyboard shortcut for
almost everything (press <kbd>⌘/</kbd> to see them).

Clicking a tag pill inside a note filters the library by it. Clicking a checkbox
ticks the todo off in the document itself.

## Type and icons

Set in [Google Sans](https://fonts.google.com/specimen/Google+Sans), with
[Google Sans Code](https://fonts.google.com/specimen/Google+Sans+Code) for code
spans, fenced blocks and the mono editor setting. Both are self-hosted from
their Fontsource packages (SIL OFL 1.1) — `src/styles/fonts.css` declares only
the latin subsets, because importing the packages' own CSS would bundle all 25
subsets and 14 MB of woff2 for a latin interface.

Icons come from [Hugeicons](https://hugeicons.com) (free set) via
`@hugeicons/react`. `src/components/Icons.tsx` maps each Hugeicons glyph to a
named component so the rest of the app imports `TrashIcon` rather than
`Delete02Icon`, and one wrapper fixes the size and stroke weight everywhere.
The bear in the sidebar is the app's own mark — Hugeicons has no bear.

## Layout

```
src/
  lib/          domain logic, no React: tag parsing, note metadata,
                search, markdown rendering, persistence
  editor/       CodeMirror setup: highlight style, decorations
                (tag pills, todo checkboxes), formatting commands
  components/   the three panes, dialogs, menus
  store/        Zustand store — the single source of truth
  hooks/        shared React hooks
```

The interesting parts are `lib/tags.ts` (the hashtag grammar and the nested tag
tree) and `editor/decorations.ts` (the live checkboxes and tag pills). Both are
covered by tests; the formatting commands are tested against a stand-in view, so
the suite needs no browser.

## Notes on storage

Notes sync to Supabase for the signed-in account (debounced ~400 ms after edits).
Theme, font, sort and pane visibility preferences still save to `localStorage`
under `bear.library.v1`. Corrupt or partial preference data is repaired on load
rather than thrown away. Use **Settings → Export backup** for a JSON copy of the
library as an extra safety net.
