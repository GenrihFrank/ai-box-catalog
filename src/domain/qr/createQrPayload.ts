export function createBoxQrPayload(boxId: string): string {
  return `/qr/${encodeURIComponent(boxId)}`;
}

export function parseBoxQrPayload(payload: string): string | null {
  const match = payload.trim().match(/^\/qr\/([^/]+)$/);

  if (!match) {
    return null;
  }

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}
