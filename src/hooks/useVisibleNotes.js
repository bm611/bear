import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { sortNotes } from '../lib/notes';
import { parseQuery, searchScore, visibleNotes } from '../lib/search';
/** The notes shown in the list, in the order they appear. */
export function useVisibleNotes() {
    const notes = useStore((state) => state.notes);
    const filter = useStore((state) => state.filter);
    const query = useStore((state) => state.query);
    const sort = useStore((state) => state.preferences.sort);
    return useMemo(() => {
        const matched = sortNotes(visibleNotes(notes, filter, query), sort);
        const parsed = parseQuery(query);
        if (parsed.terms.length === 0)
            return matched;
        return matched.sort((a, b) => searchScore(b, parsed) - searchScore(a, parsed));
    }, [notes, filter, query, sort]);
}
