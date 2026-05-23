import { proposeAndCommit, type ConsensusOutcome } from './consensus';
import { storage } from './storage';
import { computeMockTally } from './tally';
import type {
  Approval,
  Candidate,
  Election,
  SystemTransaction,
  TallyResult,
  VoteTransaction,
} from './types';

export interface ProposeElectionInput {
  electionId: string;
  name: string;
  type: string;
  districts: string[];
  candidates: Candidate[];
  startsAt: string;
  endsAt: string;
  requiredApprovals?: number;
}

export interface VoteInput {
  electionId: string;
  districtId: string;
  anonymousTokenHash: string;
  encryptedVote: string;
  proof: string;
  timestamp: string;
}

export type VoteResult =
  | {
      ok: true;
      transaction: VoteTransaction;
      block: NonNullable<ConsensusOutcome['block']>;
      validations: ConsensusOutcome['validations'];
      signatures: ConsensusOutcome['signatures'];
    }
  | {
      ok: false;
      status: number;
      error: string;
      validations?: ConsensusOutcome['validations'];
      signatures?: ConsensusOutcome['signatures'];
    };

export function listElections(): Election[] {
  return Object.values(storage.state.elections);
}

export function getElection(id: string): Election | undefined {
  return storage.state.elections[id];
}

function buildSystemTx(
  type: SystemTransaction['type'],
  electionId: string,
  payload?: Record<string, unknown>,
): Omit<SystemTransaction, 'transactionHash'> {
  return {
    type,
    electionId,
    timestamp: new Date().toISOString(),
    payload,
  };
}

export async function proposeElection(
  input: ProposeElectionInput,
  proposedBy: string,
): Promise<{ election: Election; outcome: ConsensusOutcome }> {
  const requiredApprovals = Number(input.requiredApprovals ?? 2);
  const proposedAt = new Date().toISOString();
  const election: Election = {
    electionId: input.electionId,
    name: input.name,
    type: input.type,
    districts: input.districts,
    candidates: input.candidates,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    requiredApprovals,
    status: 'PROPOSED',
    proposedBy,
    proposedAt,
    approvals: [],
  };
  storage.state.elections[election.electionId] = election;
  storage.state.usedTokensByElection[election.electionId] = [];
  storage.save();

  const outcome = await proposeAndCommit(
    buildSystemTx('ELECTION_PROPOSED', election.electionId, {
      proposedBy,
      name: election.name,
      type: election.type,
      requiredApprovals,
    }),
  );
  return { election, outcome };
}

export async function approveElection(
  electionId: string,
  institutionId: string,
): Promise<{ election: Election; outcome: ConsensusOutcome | null }> {
  const election = getElection(electionId);
  if (!election) throw new Error('Election not found');
  if (election.status !== 'PROPOSED') {
    throw new Error(`Election cannot be approved in status ${election.status}`);
  }
  if (election.approvals.some((a) => a.institutionId === institutionId)) {
    throw new Error(`Institution ${institutionId} has already approved this election`);
  }

  const approval: Approval = { institutionId, approvedAt: new Date().toISOString() };
  election.approvals.push(approval);

  let outcome: ConsensusOutcome | null = null;
  if (election.approvals.length >= election.requiredApprovals) {
    election.status = 'APPROVED';
    outcome = await proposeAndCommit(
      buildSystemTx('ELECTION_APPROVED', election.electionId, {
        approvals: election.approvals,
      }),
    );
  }
  storage.save();
  return { election, outcome };
}

export async function openElection(
  electionId: string,
): Promise<{ election: Election; outcome: ConsensusOutcome }> {
  const election = getElection(electionId);
  if (!election) throw new Error('Election not found');
  if (election.status !== 'APPROVED') {
    throw new Error(`Election must be APPROVED to open (current: ${election.status})`);
  }
  election.status = 'OPEN';
  election.openedAt = new Date().toISOString();
  const outcome = await proposeAndCommit(
    buildSystemTx('ELECTION_OPENED', election.electionId, { openedAt: election.openedAt }),
  );
  storage.save();
  return { election, outcome };
}

export async function freezeElection(
  electionId: string,
): Promise<{ election: Election; outcome: ConsensusOutcome }> {
  const election = getElection(electionId);
  if (!election) throw new Error('Election not found');
  if (election.status !== 'OPEN') {
    throw new Error(`Election must be OPEN to freeze (current: ${election.status})`);
  }
  election.status = 'FROZEN';
  election.frozenAt = new Date().toISOString();
  const outcome = await proposeAndCommit(
    buildSystemTx('ELECTION_FROZEN', election.electionId, { frozenAt: election.frozenAt }),
  );
  storage.save();
  return { election, outcome };
}

export async function tallyElection(electionId: string): Promise<{
  election: Election;
  outcome: ConsensusOutcome;
  tally: TallyResult;
}> {
  const election = getElection(electionId);
  if (!election) throw new Error('Election not found');
  if (election.status !== 'FROZEN') {
    throw new Error(`Election must be FROZEN to tally (current: ${election.status})`);
  }
  election.status = 'TALLYING';
  election.tallyStartedAt = new Date().toISOString();

  const outcome = await proposeAndCommit(
    buildSystemTx('ELECTION_TALLY_STARTED', election.electionId, {
      tallyStartedAt: election.tallyStartedAt,
    }),
  );

  const tally = computeMockTally(electionId);
  election.tally = tally;
  storage.save();
  return { election, outcome, tally };
}

export async function finishElection(
  electionId: string,
): Promise<{ election: Election; outcome: ConsensusOutcome }> {
  const election = getElection(electionId);
  if (!election) throw new Error('Election not found');
  if (election.status !== 'TALLYING') {
    throw new Error(`Election must be TALLYING to finish (current: ${election.status})`);
  }
  if (!election.tally) {
    throw new Error('Election has no tally; run /tally first');
  }
  election.status = 'FINISHED';
  election.finishedAt = new Date().toISOString();
  const outcome = await proposeAndCommit(
    buildSystemTx('ELECTION_FINISHED', election.electionId, {
      finishedAt: election.finishedAt,
      tally: election.tally,
    }),
  );
  storage.save();
  return { election, outcome };
}

export async function castVote(input: VoteInput): Promise<VoteResult> {
  if (!input || typeof input !== 'object') {
    return { ok: false, status: 400, error: 'Body must be a JSON object' };
  }
  const election = getElection(input.electionId);
  if (!election) return { ok: false, status: 404, error: 'Election not found' };

  if (election.status !== 'OPEN') {
    return {
      ok: false,
      status: 400,
      error: `Election is not OPEN (current: ${election.status})`,
    };
  }
  if (!input.districtId || !election.districts.includes(input.districtId)) {
    return { ok: false, status: 400, error: 'District does not belong to this election' };
  }
  if (!input.anonymousTokenHash) {
    return { ok: false, status: 400, error: 'anonymousTokenHash is required' };
  }
  if (!input.encryptedVote) {
    return { ok: false, status: 400, error: 'encryptedVote is required' };
  }
  if (!input.proof) {
    return { ok: false, status: 400, error: 'proof is required' };
  }
  if (!input.timestamp) {
    return { ok: false, status: 400, error: 'timestamp is required' };
  }
  const ts = Date.parse(input.timestamp);
  const startsAt = Date.parse(election.startsAt);
  const endsAt = Date.parse(election.endsAt);
  if (Number.isNaN(ts) || ts < startsAt || ts > endsAt) {
    return {
      ok: false,
      status: 400,
      error: 'Vote timestamp is outside the election window',
    };
  }

  const used = (storage.state.usedTokensByElection[input.electionId] ||= []);
  if (used.includes(input.anonymousTokenHash)) {
    return {
      ok: false,
      status: 409,
      error: 'Token already used. Re-voting is not supported.',
    };
  }

  const outcome = await proposeAndCommit({
    type: 'VOTE_CAST',
    electionId: input.electionId,
    districtId: input.districtId,
    anonymousTokenHash: input.anonymousTokenHash,
    encryptedVote: input.encryptedVote,
    proof: input.proof,
    timestamp: input.timestamp,
  });

  if (outcome.rejected || !outcome.block) {
    return {
      ok: false,
      status: 502,
      error: outcome.rejected?.reason ?? 'Consensus failed',
      validations: outcome.validations,
      signatures: outcome.signatures,
    };
  }

  used.push(input.anonymousTokenHash);
  storage.save();

  return {
    ok: true,
    transaction: outcome.block.transactions[0] as VoteTransaction,
    block: outcome.block,
    validations: outcome.validations,
    signatures: outcome.signatures,
  };
}
