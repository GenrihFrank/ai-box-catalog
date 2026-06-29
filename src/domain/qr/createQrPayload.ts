export function createBoxQrPayload(boxId: string): string {
  return `/qr/${encodeURIComponent(boxId)}`;
}
