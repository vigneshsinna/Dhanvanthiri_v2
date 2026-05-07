import { describe, expect, it } from 'vitest';
import { router } from '@/app/router';

describe('router', () => {
  it('registers the protected React admin portal under /store-admin', () => {
    expect(router.routes.some((route) => route.path === '/store-admin')).toBe(true);
  });

  it('keeps the old /super-admin URL as a React compatibility route', () => {
    expect(router.routes.some((route) => route.path === '/super-admin')).toBe(true);
  });
});
