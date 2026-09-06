import { afterEach, describe, expect, it, vi } from 'vitest';
import { COLLABORATION_INVITATIONS, type CollaborationMoment } from './collaborationContent';
import { collaborationPayload, submitCollaboration } from '@/game/services/backend/collaborationGateway';
afterEach(() => vi.unstubAllGlobals());
describe('private collaboration delivery', () => {
  it.each(Object.keys(COLLABORATION_INVITATIONS) as CollaborationMoment[])('sends only the idea and the %s context', moment => {
    const text = 'Mi canción: ¿árbol & luna?\nBcc: intruso@example.com';
    const payload = collaborationPayload(moment, text);
    expect(payload.Idea).toBe(text); expect(payload._subject).toContain(COLLABORATION_INVITATIONS[moment].subject);
    expect(payload).not.toHaveProperty('email'); expect(payload).not.toHaveProperty('_cc');
  });
  it('rejects an untouched template without sending a request', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    await expect(submitCollaboration('final', COLLABORATION_INVITATIONS.final.template)).rejects.toThrow('Escribe');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('never presents activation as successful delivery', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok:true,json:async()=>({success:'true',message:'Please activate your form'})}));
    await expect(submitCollaboration('final', 'Una luna que canta')).rejects.toThrow('buzón');
  });
  it('rejects a failed response and preserves successful responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ok:false,json:async()=>({success:false})}).mockResolvedValueOnce({ok:true,json:async()=>({success:'true'})}));
    await expect(submitCollaboration('final', 'Una luna que canta')).rejects.toThrow('no ha podido');
    await expect(submitCollaboration('final', 'Una luna que canta')).resolves.toBeUndefined();
  });
});
