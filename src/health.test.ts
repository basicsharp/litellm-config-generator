import { describe, expect, it } from 'vitest';

import { health } from './health';

describe('health', () => {
  it('returns ok', () => {
    expect(health()).toBe('ok');
  });
});
