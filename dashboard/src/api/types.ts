import type { ElectionStatus, ElectionType } from '../constants';

export interface Candidate {
  id: string;
  name: string;
}

export interface ApprovalRecord {
  institutionId: string;
  approvedAt?: string;
  blockHash?: string;
}

export interface PerCandidateTally {
  candidateId: string;
  name?: string;
  votes: number;
}

export interface PerDistrictTally {
  districtId: string;
  totalVotes: number;
  perCandidate: PerCandidateTally[];
}

/**
 * The gateway returns `perDistrict` either as an object map keyed by
 * districtId, or (in some shapes) as an array. The dashboard always
 * normalises to an array — see `normalisePerDistrict()` below.
 */
export type PerDistrictRaw =
  | PerDistrictTally[]
  | Record<string, Omit<PerDistrictTally, 'districtId'> | PerCandidateTally[]>;

export interface PublishedTally {
  totalVotes: number;
  perCandidate: PerCandidateTally[];
  perDistrict?: PerDistrictRaw;
  candidateOrder?: string[];
  finalTallyVector?: number[];
}

export function normalisePerDistrict(
  raw: PerDistrictRaw | undefined,
): PerDistrictTally[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return Object.entries(raw).map(([districtId, value]) => {
    if (Array.isArray(value)) {
      const perCandidate = value;
      return {
        districtId,
        totalVotes: perCandidate.reduce((s, c) => s + (c.votes ?? 0), 0),
        perCandidate,
      };
    }
    return { districtId, ...value };
  });
}

export interface Election {
  electionId: string;
  name: string;
  type: ElectionType;
  status: ElectionStatus;
  districts: string[];
  candidates: Candidate[];
  startsAt: string;
  endsAt: string;
  requiredApprovals: number;
  approvals?: ApprovalRecord[];
  totalVotes?: number;
  electionPublicKey?: string;
  publishedTally?: PublishedTally;
  tally?: PublishedTally;
  proposedBy?: string;
  proposedAt?: string;
}

export interface ProposeElectionPayload {
  electionId: string;
  name: string;
  type: ElectionType;
  districts: string[];
  candidates: Candidate[];
  startsAt: string;
  endsAt: string;
  requiredApprovals: number;
  electionPublicKey?: string;
}

export interface ChainTransaction {
  transactionHash: string;
  type: string;
  electionId?: string;
  payload?: unknown;
  timestamp?: string;
  [key: string]: unknown;
}

export interface ValidatorSignature {
  validatorId: string;
  signature: string;
}

export interface ChainBlock {
  blockNumber: number;
  blockHash: string;
  previousHash: string;
  timestamp: string;
  transactions: ChainTransaction[];
  validatorSignatures: ValidatorSignature[];
}

/**
 * Raw shape returned by the gateway. Each validator is wrapped in an
 * `{ ok, url, data, error? }` envelope. The gateway does NOT include a
 * top-level `consistent` / `allHeadsMatch` summary — we compute those
 * client-side in `validators.ts`.
 */
export interface RawValidatorEntry {
  url: string;
  ok: boolean;
  error?: string;
  data?: {
    validatorId: string;
    ready: boolean;
    port?: number;
    blocks: number;
    head: string;
    consensusThreshold?: number;
    peers?: string[];
  };
}

export interface RawValidatorStatusResponse {
  gatewayId?: string;
  consensusThreshold?: number;
  validators: RawValidatorEntry[];
}

/**
 * Flattened shape consumed by `<ValidatorStatusPanel />`. Produced by
 * `getValidatorStatus()` from the raw envelope above.
 */
export interface ValidatorStatusEntry {
  validatorId: string;
  reachable: boolean;
  valid: boolean;
  blockCount?: number;
  head?: string;
  url?: string;
  error?: string;
}

export interface ValidatorStatusResponse {
  validators: ValidatorStatusEntry[];
  consistent: boolean;
  allHeadsMatch: boolean;
  gatewayId?: string;
  consensusThreshold?: number;
}

export interface PerValidatorVerifyEntry {
  validatorId: string;
  /** Gateway-reported URL (may be a Docker-internal hostname). */
  url?: string;
  /** Whether the gateway could reach this validator. */
  ok?: boolean;
  valid: boolean;
  blockCount: number;
  head: string;
  issues?: string[];
}

export interface ChainVerifyResponse {
  consistent: boolean;
  allValid: boolean;
  allHeadsMatch: boolean;
  perValidator: PerValidatorVerifyEntry[];
  checkedAt?: string;
}

export interface LifecycleActionResponse {
  election?: Election;
  block?: ChainBlock;
  transaction?: ChainTransaction;
  blockHash?: string;
}
