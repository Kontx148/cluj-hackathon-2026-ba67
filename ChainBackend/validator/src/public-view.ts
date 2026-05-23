import type { Election, Transaction } from './types';

/**
 * Strip cleartext tally fields from an election unless it has reached
 * FINISHED. Used by every public read path.
 */
export function publicElectionView(e: Election): Election {
  if (e.status === 'FINISHED') return e;
  const { tally, publishedTally, ...rest } = e;
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
  if (tx.type !== 'ELECTION_FINISHED') return tx;
  const status = electionStatusById[tx.electionId];
  if (status === 'FINISHED') return tx;
  // Defensive: hide the published tally if the election is somehow not yet
  // finished but a finished block ended up in the chain.
  const { publishedTally: _omit, ...restData } = (tx.data || {}) as Record<string, unknown>;
  void _omit;
  return { ...tx, data: { ...restData, publishedTally: '<redacted-until-finished>' } };
}
