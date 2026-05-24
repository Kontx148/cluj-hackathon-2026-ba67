import { apiFetch } from './client';
import type {
  Election,
  LifecycleActionResponse,
  ProposeElectionPayload,
} from './types';

export function listElections(): Promise<Election[] | { elections: Election[] }> {
  return apiFetch<Election[] | { elections: Election[] }>('/elections');
}

/**
 * The gateway wraps the single-election response in an envelope:
 * `{ election: {...}, consistent, warning, responsiveValidators, ... }`.
 * Older builds (and the bare-object shape from the task spec) return the
 * Election directly. Accept both.
 */
export async function getElection(id: string): Promise<Election> {
  const raw = await apiFetch<Election | { election: Election }>(
    `/elections/${encodeURIComponent(id)}`,
  );
  if (raw && typeof raw === 'object' && 'election' in raw && raw.election) {
    return raw.election;
  }
  return raw as Election;
}

export function proposeElection(
  payload: ProposeElectionPayload,
): Promise<LifecycleActionResponse & { election: Election }> {
  return apiFetch('/elections/proposals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

function lifecycleAction(id: string, action: string): Promise<LifecycleActionResponse> {
  return apiFetch<LifecycleActionResponse>(
    `/elections/${encodeURIComponent(id)}/${action}`,
    { method: 'POST' },
  );
}

export const approveElection = (id: string) => lifecycleAction(id, 'approve');
export const openElection = (id: string) => lifecycleAction(id, 'open');
export const freezeElection = (id: string) => lifecycleAction(id, 'freeze');
export const tallyElection = (id: string) => lifecycleAction(id, 'tally');
export const requestDecryption = (id: string) =>
  lifecycleAction(id, 'request-threshold-decryption');
export const finishElection = (id: string) => lifecycleAction(id, 'finish');

/**
 * The backend may return either a bare array or `{ elections: [...] }`.
 * Normalise so callers don't have to care.
 */
export function normaliseElectionList(
  raw: Election[] | { elections: Election[] } | undefined,
): Election[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if ('elections' in raw && Array.isArray(raw.elections)) return raw.elections;
  return [];
}
