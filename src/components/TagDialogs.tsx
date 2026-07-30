import { useStore } from '../store/useStore'
import { ConfirmDialog, PromptDialog } from './Dialog'

/**
 * The tag rename and remove dialogs. They sit at the app root rather than in the
 * library panel because the panel is sometimes a popover, and that popover closes
 * as the dialog opens.
 */
export function TagDialogs() {
  const dialog = useStore((state) => state.tagDialog)
  const close = useStore((state) => state.closeTagDialog)
  const renameTag = useStore((state) => state.renameTag)
  const deleteTag = useStore((state) => state.deleteTag)

  if (dialog === null) return null

  if (dialog.kind === 'rename') {
    return (
      <PromptDialog
        title="Rename tag"
        description={`Every note using #${dialog.tag} — and any tag nested inside it — will be updated.`}
        initialValue={dialog.tag}
        confirmLabel="Rename"
        onCancel={close}
        onConfirm={(value) => {
          renameTag(dialog.tag, value)
          close()
        }}
      />
    )
  }

  return (
    <ConfirmDialog
      title={`Remove #${dialog.tag}?`}
      description="The hashtag is deleted from every note that uses it. The notes themselves are kept."
      confirmLabel="Remove tag"
      destructive
      onCancel={close}
      onConfirm={() => {
        deleteTag(dialog.tag)
        close()
      }}
    />
  )
}
