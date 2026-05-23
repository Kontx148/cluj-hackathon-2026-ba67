export type TransactionType =
  | 'VOTE_CAST'
  | 'ELECTION_PROPOSED'
  | 'ELECTION_APPROVED'
  | 'ELECTION_OPENED'
  | 'ELECTION_FROZEN'
  | 'ELECTION_TALLY_AGGREGATED'
  | 'ELECTION_THRESHOLD_DECRYPTED'
  | 'ELECTION_FINISHED';

export interface ActionPayload {
  type: TransactionType;
  electionId: string;
  data: Record<string, unknown>;
}

export interface ValidatorPrepareResponse {
  validatorId: string;
  proposalId: string;
  approved: boolean;
  signature?: string;
  computedAction?: ActionPayload;
  reason?: string;
}

export interface ValidatorCommitResponse {
  validatorId: string;
  proposalId: string;
  committed: boolean;
  blockNumber?: number;
  blockHash?: string;
  reason?: string;
}

export interface DecryptionShareResponse {
  validatorId: string;
  electionId: string;
  partialDecryptionShare: string;
  error?: string;
}
