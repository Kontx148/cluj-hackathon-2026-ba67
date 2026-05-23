export type ElectionStatus =
  | 'PROPOSED'
  | 'APPROVED'
  | 'OPEN'
  | 'FROZEN'
  | 'TALLYING'
  | 'DECRYPTED'
  | 'FINISHED';

export interface Candidate {
  id: string;
  name: string;
}

export interface Approval {
  institutionId: string;
  approvedAt: string;
}

export interface PerCandidateResult {
  candidateId: string;
  name: string;
  votes: number;
}

export interface PerDistrictResult {
  finalTallyVector: number[];
  totalVotes: number;
  perCandidate: PerCandidateResult[];
}

export interface DecryptionShare {
  validatorId: string;
  partialDecryptionShare: string;
}

export interface TallyAggregate {
  candidateOrder: string[];
  encryptedAggregateMock: string;
  totalEncryptedVotes: number;
  aggregatedAt: string;
}

export interface TallyResult {
  electionId: string;
  candidateOrder: string[];
  finalTallyVector: number[];
  totalVotes: number;
  perCandidate: PerCandidateResult[];
  perDistrict: Record<string, PerDistrictResult>;
  decryptionShares: DecryptionShare[];
  decryptedAt: string;
}

export interface DecryptionMeta {
  decryptionShares: DecryptionShare[];
  validatorIds: string[];
  combinedShareHash: string;
  decryptedAt: string;
}

export interface Election {
  electionId: string;
  name: string;
  type: string;
  districts: string[];
  candidates: Candidate[];
  startsAt: string;
  endsAt: string;
  requiredApprovals: number;
  electionPublicKey: string;
  electionPrivateKey: string;
  status: ElectionStatus;
  proposedBy: string;
  proposedAt: string;
  approvals: Approval[];
  openedAt?: string;
  frozenAt?: string;
  tallyAggregate?: TallyAggregate;
  decryptionMeta?: DecryptionMeta;
  /**
   * Cleartext tally. Computed locally by each validator at decryption time
   * but only exposed via API once the election reaches FINISHED.
   */
  tally?: TallyResult;
  finishedAt?: string;
  publishedTally?: TallyResult;
}

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
  // type-specific data
  data: Record<string, unknown>;
}

export interface Transaction {
  transactionHash: string;
  type: TransactionType;
  electionId: string;
  data: Record<string, unknown>;
  proposalId: string;
  proposedAt: string;
}

export interface ValidatorSignature {
  validatorId: string;
  signature: string;
}

export interface Block {
  blockNumber: number;
  previousHash: string;
  timestamp: string;
  transactions: Transaction[];
  validatorSignatures: ValidatorSignature[];
  blockHash: string;
}

export interface ValidatorState {
  elections: Record<string, Election>;
  usedTokensByElection: Record<string, string[]>;
  blocks: Block[];
}
