import { describe, expect, it } from 'vitest';

import { createBoxQrPayload, parseBoxQrPayload } from '../../src/domain';

describe('createBoxQrPayload', () => {
  it('uses stable box id instead of mutable box number', () => {
    expect(createBoxQrPayload('box-123')).toBe('/qr/box-123');
  });

  it('encodes box id for route payload', () => {
    expect(createBoxQrPayload('box/123')).toBe('/qr/box%2F123');
  });
});

describe('parseBoxQrPayload', () => {
  it('parses stable box id from QR payload', () => {
    expect(parseBoxQrPayload('/qr/box-123')).toBe('box-123');
  });

  it('decodes route encoded box id', () => {
    expect(parseBoxQrPayload('/qr/box%2F123')).toBe('box/123');
  });

  it('rejects non-box QR payloads', () => {
    expect(parseBoxQrPayload('https://example.com')).toBeNull();
    expect(parseBoxQrPayload('/boxes/box-123')).toBeNull();
  });

  it('rejects invalid encoded box id', () => {
    expect(parseBoxQrPayload('/qr/%E0%A4%A')).toBeNull();
  });
});
