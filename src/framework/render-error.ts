export function logRenderError(error: unknown) {
  if (
    error instanceof Error &&
    error.message === 'The render was aborted by the server without a reason.'
  ) {
    return;
  }

  console.error(error);
}
