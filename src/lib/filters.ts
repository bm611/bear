import type { Filter } from './types'

/** The display name a filter carries in the list header and editor crumb. */
export function filterTitle(filter: Filter): string {
  switch (filter.kind) {
    case 'all':
      return 'Notes'
    case 'untagged':
      return 'Untagged'
    case 'todo':
      return 'Todo'
    case 'today':
      return 'Today'
    case 'archive':
      return 'Archive'
    case 'trash':
      return 'Trash'
    case 'tag':
      return `#${filter.tag}`
  }
}
