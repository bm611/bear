import { autocompletion, type Completion, type CompletionSource } from '@codemirror/autocomplete'
import type { Extension } from '@codemirror/state'

export interface TagSuggestion {
  tag: string
  count: number
}

/** Autocompletes `#` against the tags already used elsewhere in the library. */
export function tagCompletion(getTags: () => TagSuggestion[]): Extension {
  const source: CompletionSource = (context) => {
    const typed = context.matchBefore(/#[^\s#]*/)
    if (!typed) return null
    if (typed.from === typed.to && !context.explicit) return null

    const suggestions = getTags()
    if (suggestions.length === 0) return null

    const options: Completion[] = suggestions.map(({ tag, count }) => ({
      label: `#${tag}`,
      detail: count === 1 ? '1 note' : `${count} notes`,
      type: 'keyword',
      boost: Math.min(count, 20),
    }))

    return { from: typed.from, options, validFor: /^#[^\s#]*$/ }
  }

  return autocompletion({
    override: [source],
    activateOnTyping: true,
    icons: false,
    closeOnBlur: true,
    maxRenderedOptions: 20,
  })
}
