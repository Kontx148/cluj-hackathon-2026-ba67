import type { Election, Transaction } from './types';

/**
 * Strip cleartext tally fields from an election unless it has reached
 * FINISHED. Used by every public read path.
 */
export function publicElectionView(e: Election): Election {
  const { electionPrivateKey, ...withoutPrivateKey } = e;
  void electionPrivateKey;
  if (withoutPrivateKey.status === 'FINISHED') return withoutPrivateKey as Election;
  const { tally, publishedTally, ...rest } = withoutPrivateKey;
  return rest as Election;
}

/**
 * Strip cleartext tally fields from a chain transaction.
 * Currently the chain only stores cleartext results inside ELECTION_FINISHED
 * blocks; everything before that is already public-safe.
 *
 * If you decide to start putting cleartext fields into
 * ELECTION_THRESHOLD_DECRYPTED later, redact them here based on the live
 * election status.
 */
export function publicTransactionView(
  tx: Transaction,
  electionStatusById: Record<string, string>,
): Transaction {
  const data = tx.data || {};
  const { electionPrivateKey, ...withoutPrivateKey } = data as Record<string, unknown>;
  void electionPrivateKey;
  const safeTx = { ...tx, data: withoutPrivateKey };

  if (tx.type !== 'ELECTION_FINISHED') return safeTx;
  const status = electionStatusById[tx.electionId];
  if (status === 'FINISHED') return safeTx;
  // Defensive: hide the published tally if the election is somehow not yet
  // finished but a finished block ended up in the chain.
  const { publishedTally: _omit, ...restData } = safeTx.data as Record<string, unknown>;
  void _omit;
  return { ...safeTx, data: { ...restData, publishedTally: '<redacted-until-finished>' } };
}
