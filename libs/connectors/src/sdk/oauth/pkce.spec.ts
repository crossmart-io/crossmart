import { pkceS256Challenge } from './pkce.js';

describe('pkceS256Challenge', () => {
  it('matches the S256 example of RFC 7636 Appendix B', () => {
    expect(pkceS256Challenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
    );
  });

  it('matches the example of Etsy’s authentication guide', () => {
    expect(pkceS256Challenge('vvkdljkejllufrvbhgeiegrnvufrhvrffnkvcknjvfid')).toBe(
      'DSWlW2Abh-cf8CeLL8-g3hQ2WQyYdKyiu83u_s7nRhI',
    );
  });
});
