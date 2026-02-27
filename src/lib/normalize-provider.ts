export function normalizeProviderId(providerId?: string): string | undefined {
  if (!providerId) {
    return providerId;
  }
  return providerId.startsWith('vertex_ai') ? 'vertex_ai' : providerId;
}
