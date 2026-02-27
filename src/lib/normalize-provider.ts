export function normalizeProviderId(providerId?: string): string | undefined {
  if (!providerId) {
    return providerId;
  }
  if (providerId === 'azure_text') {
    return 'azure';
  }
  return providerId.startsWith('vertex_ai') ? 'vertex_ai' : providerId;
}
