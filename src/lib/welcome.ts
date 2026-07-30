import type { Note } from './types'
import { createNote } from './notes'

const WELCOME = `# Welcome to Slate

A small, fast place to keep everything you write. Notes are plain markdown and they save as you type, synced to your account.

## Organise with hashtags
Forget folders. Just write a tag anywhere in a note and it appears in the library — click the list's title to open it:

#welcome #ideas/writing

Tags nest with a slash, so #ideas/writing sits inside **ideas**. Need spaces? Close the tag with a second hash, like #reading list#.

## Markdown, styled as you type
There is no preview mode to toggle — the editor *is* the preview.

- **bold**, *italic*, ~~struck through~~ and ==highlighted==
- \`inline code\` and fenced blocks
- [links](https://example.com)
- > quotes for the things worth quoting

Headings, numbered lists, tables and horizontal rules all work the way you would expect:

| Syntax | Result |
| --- | --- |
| \`# text\` | heading |
| \`- [ ]\` | todo |
| \`#tag\` | a tag |

## Todos
- [x] Write a first note
- [ ] Press ⌘⇧U on a line to turn it into a todo
- [ ] Click a checkbox to tick it off

## Get around quickly
| Shortcut | Does |
| --- | --- |
| ⌘N | New note |
| ⌘F | Search |
| ⌘2 | Show or hide the note list |
| ⌘/ | Every other shortcut |

Delete this note whenever you like — press ⌘⌫.`

export function welcomeNotes(now = Date.now()): Note[] {
  return [createNote(WELCOME, now)]
}
