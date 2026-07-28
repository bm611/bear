import { describe, expect, it } from 'vitest'
import { escapeHtml, exportNoteHtml, renderMarkdown, slugify } from './markdown'

describe('renderMarkdown', () => {
  it('renders headings, emphasis and lists', () => {
    expect(renderMarkdown('# Title')).toContain('<h1>Title</h1>')
    expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>')
    expect(renderMarkdown('- one\n- two')).toContain('<li>one</li>')
  })

  it('renders highlights', () => {
    expect(renderMarkdown('==look here==')).toContain('<mark>look here</mark>')
    expect(renderMarkdown('==**both**==')).toContain('<mark><strong>both</strong></mark>')
  })

  it('renders hashtags as pills', () => {
    expect(renderMarkdown('filed under #work')).toContain('<span class="md-hashtag">#work</span>')
  })

  it('leaves mid-word hashes and code alone', () => {
    expect(renderMarkdown('a#b')).not.toContain('md-hashtag')
    expect(renderMarkdown('`#work`')).not.toContain('md-hashtag')
    expect(renderMarkdown('```\n#work\n```')).not.toContain('md-hashtag')
  })

  it('renders task lists as checkboxes', () => {
    const html = renderMarkdown('- [ ] open\n- [x] done')
    expect(html).toContain('type="checkbox"')
    expect(html).toContain('checked')
  })

  it('renders tables', () => {
    expect(renderMarkdown('| a | b |\n| --- | --- |\n| 1 | 2 |')).toContain('<table>')
  })
})

describe('escapeHtml', () => {
  it('escapes the dangerous five', () => {
    expect(escapeHtml('<a href="x">&\'</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;')
  })
})

describe('exportNoteHtml', () => {
  it('produces a standalone document with an escaped title', () => {
    const html = exportNoteHtml('Notes & <ideas>', '# Hello')
    expect(html.startsWith('<!doctype html>')).toBe(true)
    expect(html).toContain('<title>Notes &amp; &lt;ideas&gt;</title>')
    expect(html).toContain('<h1>Hello</h1>')
  })
})

describe('slugify', () => {
  it('makes a safe file name', () => {
    expect(slugify('Weekend Shopping!')).toBe('weekend-shopping')
    expect(slugify('  ')).toBe('note')
    expect(slugify('Ünïcode ok')).toBe('ünïcode-ok')
  })
})
