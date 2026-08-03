/**
 * Dev-only preview harness (`/dev.html`, served by `npm run dev` only — the
 * production build's rollup input is `index.html` alone). Mounts the signed-in
 * app shell with seeded local notes so the UI can be exercised without a
 * Supabase session. Nothing syncs: the store's push path is gated on a user id
 * that is never set here.
 */
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { AppShell } from '../App'
import { useStore } from '../store/useStore'
import { createNote } from '../lib/notes'
import type { Note } from '../lib/types'
import '../styles/fonts.css'
import '../styles/global.css'

const HOUR = 3_600_000
const DAY = 24 * HOUR
const now = Date.now()

function seed(text: string, age: number, extra?: Partial<Note>): Note {
  const note = createNote(text, now - age)
  return { ...note, updatedAt: now - age, ...extra }
}

const NOTES: Note[] = [
  seed(
    `# Kitchen renovation notes\n\nMeasured the north wall again — 342cm, not the 350 on the floor plan. The corner cabinet has to shrink or the fridge moves.\n\n## Quotes so far\n\n| Contractor | Quote | Callback |\n| --- | --- | --- |\n| Meridian Build | $18,400 | Tue |\n| H. Okafor & Sons | $16,950 | done |\n\n- [x] Confirm counter depth with Ana\n- [ ] Ask about load-bearing wall on the west side\n- [ ] Book asbestos check before demo\n\n#home/renovation #todo`,
    2 * HOUR,
    { pinned: true },
  ),
  seed(
    `# Reading list, spring\n\nCurrently on *The Making of the Atomic Bomb* — dense but worth it. Rhodes writes physicists like characters in a novel.\n\n- [x] The Making of the Atomic Bomb — Richard Rhodes\n- [ ] A Pattern Language — Alexander\n- [ ] The Peregrine — J. A. Baker\n\n> The instrument of discovery is the person. — quoted in ch. 4\n\n#reading`,
    9 * HOUR,
  ),
  seed(
    `# Standup notes — sync service\n\nBlocked on the retry queue again. The dead-letter handling drops messages when the payload exceeds 256kb, which is exactly the case we built it for.\n\n\`\`\`ts\nconst retry = withBackoff(push, { base: 400, cap: 30_000 })\n\`\`\`\n\nTalk to Priya about splitting the payloads before Friday.\n\n#work/sync #work/standup`,
    1 * DAY,
  ),
  seed(
    `# Grocery run\n\n- [ ] Coffee beans (the Ethiopian ones from Cedar St)\n- [ ] Cardamom\n- [ ] Rye flour — 2 bags\n- [x] Olive oil\n- [ ] Parchment paper\n\n#home`,
    2 * DAY,
  ),
  seed(
    `# Ideas that refuse to die\n\nA tiny site that renders any RSS feed as a printed broadsheet. Weekly digest, typeset properly, one sheet of A4.\n\nWould pair well with the e-ink display gathering dust in the drawer.\n\n#ideas`,
    4 * DAY,
  ),
  seed(
    `# Marathon block, week 3\n\nLegs finally coming around. 62km this week.\n\n| Day | Session | Feel |\n| --- | --- | --- |\n| Tue | 8 × 400 @ 5k pace | strong |\n| Thu | 14km steady | flat |\n| Sun | 26km long | good |\n\nNext week drops to 48km before the half.\n\n#running/training`,
    6 * DAY,
  ),
  seed(`# Archived: old router config\n\nKept only in case the ISP swap goes sideways.\n\nPPPoE user: (in the vault). VLAN 35 on WAN.\n\n#reference`, 30 * DAY, {
    archived: true,
  }),
  seed(`# Draft that went nowhere\n\nHalf a blog post about calendar apps. It wasn't going anywhere.`, 12 * DAY, {
    trashedAt: now - 3 * DAY,
  }),
]

useStore.setState({
  notes: NOTES,
  notesHydrated: true,
  selectedId: NOTES[0].id,
  filter: { kind: 'all' },
})

/** Same `data-theme` plumbing as `App`'s useTheme, minus the auth gating. */
function DevShell() {
  const theme = useStore((state) => state.preferences.theme)
  const font = useStore((state) => state.preferences.font)
  const fontSize = useStore((state) => state.preferences.fontSize)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme
      document.documentElement.dataset.theme = resolved
    }
    apply()
    if (theme !== 'system') return
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  useEffect(() => {
    const stacks = {
      sans: 'var(--font-ui)',
      inter: 'var(--font-inter)',
      system: 'var(--font-system)',
      mono: 'var(--font-mono)',
    } as const
    document.documentElement.style.setProperty('--editor-font', stacks[font])
    document.documentElement.style.setProperty('--editor-font-size', `${fontSize}px`)
  }, [font, fontSize])

  return <AppShell />
}

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

createRoot(root).render(
  <StrictMode>
    <DevShell />
  </StrictMode>,
)
