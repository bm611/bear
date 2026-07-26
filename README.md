# Bear

A note taking app in the spirit of [Bear](https://bear.app): three panes, plain
markdown, and hashtags instead of folders. It runs entirely in the browser —
notes live in `localStorage`, so there is no account, no server and no sync.

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
syntax markers stay visible but recede in colour, so a note is always editable
plain text. Built on CodeMirror 6 with a custom highlight style, live todo
checkboxes and inline tag pills.

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

Notes are saved to `localStorage` under `bear.library.v1`, debounced 400 ms after
the last keystroke. Corrupt or partial data is repaired on load rather than
thrown away — unknown preferences fall back to defaults and malformed notes are
dropped. Use **Settings → Export backup** for a JSON copy of the library, since
clearing site data will delete the notes.
