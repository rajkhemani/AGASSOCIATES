import { describe, expect, it } from 'vitest';
import { evaluateAction } from '../src/server/actionGateway.ts';
import { permissionsForRole } from '../src/server/auth.ts';

describe('Action Gateway', () => {
  const principal = { id: 'principal', role: 'PRINCIPAL', permissions: permissionsForRole('PRINCIPAL') };
  const advocate = { id: 'advocate', role: 'ADVOCATE', permissions: permissionsForRole('ADVOCATE') };

  it('allows L0 actions with the matching permission', () => {
    expect(evaluateAction('matter.read', principal).allowed).toBe(true);
  });

  it('blocks L2 actions until an independent approval exists', () => {
    const pending = evaluateAction('document.delete', advocate);
    expect(pending.allowed).toBe(false);
    expect(evaluateAction('document.delete', advocate, [{ approverId: 'principal', role: 'PRINCIPAL' }]).allowed).toBe(true);
  });

  it('requires two distinct principal approvals for L3 actions', () => {
    expect(evaluateAction('payment.release', principal, [{ approverId: 'a', role: 'PRINCIPAL' }]).allowed).toBe(false);
    expect(evaluateAction('payment.release', principal, [
      { approverId: 'a', role: 'PRINCIPAL' },
      { approverId: 'b', role: 'PRINCIPAL' },
    ]).allowed).toBe(true);
  });
});
