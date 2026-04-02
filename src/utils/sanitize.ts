export const sanitizePlainText = (value: string): string => {
  // Keep user notes as plain text by removing angle brackets to reduce XSS vectors.
  return value.replace(/[<>]/g, '').trim()
}
