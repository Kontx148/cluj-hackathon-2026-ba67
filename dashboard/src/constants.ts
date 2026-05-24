/**
 * Tunable polling intervals — change these to slow down or speed up the
 * dashboard without searching the codebase.
 */
export const ELECTIONS_POLL_MS = 10_000;
export const VALIDATORS_POLL_MS = 5_000;
export const ELECTION_DETAIL_POLL_MS = 5_000;

/**
 * Toast UI behaviour.
 */
export const TOAST_DISMISS_MS = 6_000;

/**
 * Recognised institutions in the credential bar. The literal "Admin" is a
 * special case that sends only `x-api-key` (admin key) and no
 * `x-institution-id`.
 */
export const INSTITUTIONS = ['Admin', 'AEP', 'BEC', 'COURT'] as const;
export type InstitutionRole = (typeof INSTITUTIONS)[number];

/**
 * Demo keys — surfaced as placeholder text in the credential bar only.
 * Never hard-coded into requests.
 */
export const DEMO_API_KEYS: Record<InstitutionRole, string> = {
  Admin: 'dev-admin-key',
  AEP: 'dev-aep-key',
  BEC: 'dev-bec-key',
  COURT: 'dev-court-key',
};

/**
 * Election lifecycle. Source of truth for status badges and which action
 * buttons render in the action panel.
 */
export const ELECTION_STATUSES = [
  'PROPOSED',
  'APPROVED',
  'OPEN',
  'FROZEN',
  'TALLYING',
  'DECRYPTED',
  'FINISHED',
] as const;
export type ElectionStatus = (typeof ELECTION_STATUSES)[number];

export const ELECTION_TYPES = ['PRESIDENTIAL', 'LOCAL', 'REFERENDUM'] as const;
export type ElectionType = (typeof ELECTION_TYPES)[number];

/**
 * Validators displayed in the right-hand panel. Three rows are rendered
 * regardless of how many the gateway reports, so the operator can tell
 * at a glance whether any are unreachable.
 */
export const EXPECTED_VALIDATORS = ['validator-1', 'validator-2', 'validator-3'] as const;
