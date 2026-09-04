import { forwardRef } from 'react'

type TruckExplorerCloseButtonProps = Readonly<{
  onClose: () => void
  open: boolean
}>

export const TruckExplorerCloseButton = forwardRef<
  HTMLButtonElement,
  TruckExplorerCloseButtonProps
>(function TruckExplorerCloseButton({ onClose, open }, ref) {
  return (
    <button
      className="truck-explorer-close"
      type="button"
      aria-label="Chiudi esplorazione"
      onClick={onClose}
      ref={ref}
      tabIndex={open ? 0 : -1}
    >
      <span aria-hidden="true" />
      <span>Chiudi esplorazione</span>
    </button>
  )
})
