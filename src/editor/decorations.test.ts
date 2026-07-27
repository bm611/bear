import { describe, expect, it } from 'vitest'
import { headingMarkRanges } from './decorations'

/** Replaces the folded ranges with `·` so the expectations read like the line. */
function folded(text: string) {
  let out = ''
  let pos = 0
  for (const range of headingMarkRanges(text)) {
    out += text.slice(pos, range.from) + '·'
    pos = range.to
  }
  return out + text.slice(pos)
}

describe('headingMarkRanges', () => {
  it('folds the hashes and the space after them', () => {
    expect(folded('# Title')).toBe('·Title')
    expect(folded('###### Small')).toBe('·Small')
  })

  it('folds a closing sequence too', () => {
    expect(folded('## Title ##')).toBe('·Title·')
  })

  it('folds the indent a heading is allowed to carry', () => {
    expect(folded('   ## Title')).toBe('·Title')
  })

  it('leaves a heading that is only markers alone', () => {
    expect(headingMarkRanges('#')).toEqual([])
    expect(headingMarkRanges('#   ')).toEqual([])
  })

  it('leaves lines that are not ATX headings alone', () => {
    expect(headingMarkRanges('#hashtag')).toEqual([])
    expect(headingMarkRanges('Just prose')).toEqual([])
    expect(headingMarkRanges('####### Seven hashes')).toEqual([])
  })

  it('keeps a trailing hashtag, which is not a closing sequence', () => {
    expect(folded('# Title #work')).toBe('·Title #work')
    expect(folded('# Title #reading list#')).toBe('·Title #reading list#')
  })

  it('keeps hashes inside the heading text', () => {
    expect(folded('# C# and F#, mostly')).toBe('·C# and F#, mostly')
  })
})
