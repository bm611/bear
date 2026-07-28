import { useEffect, useState } from 'react'
import type { Filter, TagNode } from '../lib/types'
import { ChevronRight, MoreIcon, TagIcon, TrashIcon, PencilIcon } from './Icons'
import { Menu, MenuItem, MenuSeparator } from './Menu'

interface TagTreeProps {
  nodes: TagNode[]
  filter: Filter
  onSelect: (tag: string) => void
  onRename: (tag: string) => void
  onDelete: (tag: string) => void
  depth?: number
}

export function TagTree({ nodes, filter, onSelect, onRename, onDelete, depth = 0 }: TagTreeProps) {
  return (
    <div className={depth > 0 ? 'tag-children' : undefined}>
      {nodes.map((node) => (
        <TagRow
          key={node.path}
          node={node}
          filter={filter}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
          depth={depth}
        />
      ))}
    </div>
  )
}

interface TagRowProps extends Omit<TagTreeProps, 'nodes'> {
  node: TagNode
}

function TagRow({ node, filter, onSelect, onRename, onDelete, depth = 0 }: TagRowProps) {
  const activePath = filter.kind === 'tag' ? filter.tag.toLowerCase() : ''
  const isSelected = activePath === node.path.toLowerCase()
  const containsSelection = activePath.startsWith(node.path.toLowerCase() + '/')
  const [open, setOpen] = useState(containsSelection)
  const [menuOpen, setMenuOpen] = useState(false)
  const hasChildren = node.children.length > 0

  // Reveal the branch when a nested tag is selected from elsewhere.
  useEffect(() => {
    if (containsSelection) setOpen(true)
  }, [containsSelection])

  return (
    <div className="menu-anchor">
      <div className="tag-row-wrapper">
        {hasChildren ? (
          <button
            type="button"
            className="disclosure"
            data-open={open ? 'true' : 'false'}
            aria-label={`${open ? 'Collapse' : 'Expand'} ${node.name}`}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <ChevronRight size={12} />
          </button>
        ) : (
          <span className="disclosure" aria-hidden="true" />
        )}

        <button
          type="button"
          className="sidebar-row"
          aria-current={isSelected ? 'true' : undefined}
          onClick={() => onSelect(node.path)}
          onContextMenu={(event) => {
            event.preventDefault()
            setMenuOpen(true)
          }}
          title={`#${node.path}`}
        >
          <span className="sidebar-row-icon">
            <TagIcon size={15} />
          </span>
          <span className="sidebar-row-label">{node.name}</span>
          <span className="count-badge">{node.count}</span>
        </button>

        <button
          type="button"
          className="icon-button tag-row-more"
          aria-label={`Actions for #${node.path}`}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          <MoreIcon size={14} />
        </button>
      </div>

      {menuOpen ? (
        <Menu
          align="right"
          label={`Actions for #${node.path}`}
          onClose={() => setMenuOpen(false)}
          style={{ top: '1.9rem' }}
        >
          <MenuItem
            icon={<PencilIcon size={15} />}
            onSelect={() => {
              setMenuOpen(false)
              onRename(node.path)
            }}
          >
            Rename tag…
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            icon={<TrashIcon size={15} />}
            danger
            onSelect={() => {
              setMenuOpen(false)
              onDelete(node.path)
            }}
          >
            Remove from notes…
          </MenuItem>
        </Menu>
      ) : null}

      {hasChildren && open ? (
        <TagTree
          nodes={node.children}
          filter={filter}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
          depth={depth + 1}
        />
      ) : null}
    </div>
  )
}
