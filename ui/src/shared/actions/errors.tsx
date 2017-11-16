export const errorThrown = (
  error: string,
  altText?: string,
  alertType?: string
) => ({
  type: 'ERROR_THROWN',
  error,
  altText,
  alertType,
})
