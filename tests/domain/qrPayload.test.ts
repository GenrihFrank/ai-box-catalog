import { describe, expect, it } from 'vitest';

import { createBoxQrPayload } from '../../src/domain';

describe('createBoxQrPayload', () => {
  it('uses stable box id instead of mutable box number', () => {
    expect(createBoxQrPayload('box-123')).toBe('/qr/box-123');
  });

  it('encodes box id for route payload', () => {
    expect(createBoxQrPayload('box/123')).toBe('/qr/box%2F123');
  });
});
