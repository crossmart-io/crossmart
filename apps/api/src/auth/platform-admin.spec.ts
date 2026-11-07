import { PrincipalKind } from './enums/principal-kind.enum.js';
import type { UserPrincipal } from './entities/principal.js';
import { isPlatformAdmin } from './platform-admin.js';

const ADMINS = new Set(['yariv@crossmart.io']);
const USER: UserPrincipal = {
  kind: PrincipalKind.User,
  userId: 'user-1',
  name: 'Yariv',
  email: 'Yariv@Crossmart.io',
  emailVerified: true,
};

describe('isPlatformAdmin', () => {
  it('accepts a listed, verified email whatever its case', () => {
    expect(isPlatformAdmin(USER, ADMINS)).toBe(true);
  });

  it('refuses an unverified address, so nobody can sign up as an admin', () => {
    expect(isPlatformAdmin({ ...USER, emailVerified: false }, ADMINS)).toBe(false);
  });

  it('refuses other people, anonymous callers and an empty list', () => {
    expect(isPlatformAdmin({ ...USER, email: 'someone@example.com' }, ADMINS)).toBe(false);
    expect(isPlatformAdmin(undefined, ADMINS)).toBe(false);
    expect(isPlatformAdmin(USER, new Set())).toBe(false);
  });
});
