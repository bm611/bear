import type { Note } from './types'
import { createNote } from './notes'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const WELCOME = `# Welcome to Bear

A small, fast place to keep everything you write. Notes are plain markdown, they save as you type, and they live in this browser — no account, no sync, no server.

## Organise with hashtags
Forget folders. Just write a tag anywhere in a note and it appears in the sidebar:

#welcome #ideas/writing

Tags nest with a slash, so #ideas/writing sits inside **ideas**. Need spaces? Close the tag with a second hash, like #reading list#.

## Markdown, styled as you type
There is no preview mode to toggle — the editor *is* the preview.

- **bold**, *italic*, ~~struck through~~ and ==highlighted==
- \`inline code\` and fenced blocks
- [links](https://example.com)
- > quotes for the things worth quoting

## Todos
- [x] Write a first note
- [ ] Press ⌘⇧U on a line to turn it into a todo
- [ ] Click a checkbox to tick it off

## Get around quickly
| Shortcut | Does |
| --- | --- |
| ⌘N | New note |
| ⌘F | Search |
| ⌘1 / ⌘2 | Toggle sidebar and note list |
| ⌘/ | Every other shortcut |

Delete this note whenever you like — press ⌘⌫.`

const MARKDOWN = `Markdown cheat sheet

Everything Bear understands, in one page. #welcome #reference

# Heading 1
## Heading 2
### Heading 3

Emphasis: *italic*, **bold**, ***both***, ~~strikethrough~~, ==highlight==.

Lists nest by indenting:

- Coffee
- Tea
    - Green
    - Oolong
- Something stronger

1. First
2. Second
3. Third

Todos live anywhere in a note:

- [ ] Open
- [x] Done

> A blockquote holds a thought that isn't yours.

Code stays monospaced, inline like \`npm run dev\` or fenced:

\`\`\`js
const notes = library.filter((note) => note.tags.includes('reference'))
console.log(notes.length)
\`\`\`

Tables line up:

| Syntax | Result |
| --- | --- |
| \`# text\` | heading |
| \`- [ ]\` | todo |
| \`#tag\` | a tag |

Horizontal rules separate sections:

---

Links can be [inline](https://example.com) or bare: https://example.com`

const GROCERIES = `Weekend shopping

- [ ] Coffee beans
- [ ] Sourdough
- [x] Olive oil
- [ ] Lemons
- [ ] Something for Sunday lunch

#errands #shopping`

const IDEA = `Notes on a note taking app

The good ones get out of the way. A few principles worth keeping:

1. **Plain text wins.** Anything else is a migration problem waiting to happen.
2. **Tags beat folders.** A note can be about two things at once.
3. **One window.** Sidebar, list, editor — nothing else to manage.
4. **Typing is the interface.** Not toolbars, not menus.

> "The best interface is no interface, but the second best is a text field."

#ideas/writing #product`

const RECIPE = `Overnight oats

Mix in a jar, refrigerate, eat cold.

- 50g rolled oats
- 120ml milk of choice
- 1 tbsp yoghurt
- Pinch of salt
- Honey to taste

Top with whatever fruit is about to turn. #recipes #reading list#`

export function welcomeNotes(now = Date.now()): Note[] {
  const seeds: Array<{ text: string; age: number; pinned?: boolean }> = [
    { text: WELCOME, age: 2 * MINUTE, pinned: true },
    { text: MARKDOWN, age: 3 * HOUR },
    { text: GROCERIES, age: 8 * HOUR },
    { text: IDEA, age: 2 * DAY },
    { text: RECIPE, age: 9 * DAY },
  ]

  return seeds.map(({ text, age, pinned }) => {
    const note = createNote(text, now - age)
    return { ...note, pinned: pinned === true }
  })
}
