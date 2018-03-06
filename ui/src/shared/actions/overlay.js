export const showOverlay = childNode => ({
  type: 'SHOW_OVERLAY',
  payload: {childNode},
})

export const dismissOverlay = () => ({
  type: 'DISMISS_OVERLAY',
})
