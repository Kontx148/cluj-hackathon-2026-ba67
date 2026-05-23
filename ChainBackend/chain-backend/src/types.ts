export type ElectionStatus =
  | 'PROPOSED'
  | 'APPROVED'
  | 'OPEN'
  | 'FROZEN'
  | 'TALLYING'
  | 'FINISHED';

export interface Candidate {
  id: string;
  name: string;
}

export interface Approval {
  institutionId: string;
  approvedAt: string;
}

export interface TallyResult {
  electionId: string;
  totalVotes: number;
  perCandidate: Record<string, number>;
  perDistrict: Record<string, Record<string, number>>;
  computedAt: string;
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
  status: ElectionStatus;
  proposedBy: string;
  proposedAt: string;
  approvals: Approval[];
  openedAt?: string;
  frozenAt?: string;
  tallyStartedAt?: string;
  finishedAt?: string;
  tally?: TallyResult;
}

export type TransactionType =
  | 'VOTE_CAST'
  | 'ELECTION_PROPOSED'
  | 'ELECTION_APPROVED'
  | 'ELECTION_OPENED'
  | 'ELECTION_FROZEN'
  | 'ELECTION_TALLY_STARTED'
  | 'ELECTION_FINISHED';

export interface BaseTransaction {
  transactionHash: string;
  type: TransactionType;
  electionId: string;
  timestamp: string;
}

export interface VoteTransaction extends BaseTransaction {
  type: 'VOTE_CAST';
  districtId: string;
  anonymousTokenHash: string;
  encryptedVote: string;
  proof: string;
}

export interface SystemTransaction extends BaseTransaction {
  type: Exclude<TransactionType, 'VOTE_CAST'>;
  payload?: Record<string, unknown>;
}

export type Transaction = VoteTransaction | SystemTransaction;

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

export interface ChainState {
  elections: Record<string, Election>;
  /** Tokens already used per election; enforces "one vote per token". */
  usedTokensByElection: Record<string, string[]>;
  blocks: Block[];
}
