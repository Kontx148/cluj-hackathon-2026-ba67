import { config } from './config';
import { computeAggregate } from './tally';
import { validatorVoteVerificationService } from './validator-vote-verification-service';
import { decodeVote } from './vote-vector';
import type { ActionPayload, ValidatorState } from './types';

export interface ValidationOk {
  ok: true;
  /** Action with all derived fields filled in (returned to gateway). */
  computedAction: ActionPayload;
}
export interface ValidationFail {
  ok: false;
  error: string;
}
export type ValidationResult = ValidationOk | ValidationFail;

/**
 * Validate a proposed action against the validator's local state.
 *
 * For "external" actions (VOTE_CAST, ELECTION_PROPOSED, ...) the payload
 * is echoed back unchanged in `computedAction`.
 *
 * For "derived" actions (ELECTION_TALLY_AGGREGATED) the validator computes
 * additional payload fields from its own chain so all validators converge
 * on the same content. The gateway then picks the majority value.
 */
export function validateAction(
  state: ValidatorState,
  action: ActionPayload,
): ValidationResult {
  if (!action || typeof action !== 'object' || !action.type || !action.electionId) {
    return { ok: false, error: 'action must have type and electionId' };
  }
  const data = (action.data && typeof action.data === 'object'
    ? (action.data as Record<string, unknown>)
    : {}) as Record<string, unknown>;

  switch (action.type) {
    case 'ELECTION_PROPOSED': {
      if (state.elections[action.electionId]) {
        return { ok: false, error: `election ${action.electionId} already exists` };
      }
      const required = [
        'name',
        'type',
        'districts',
        'candidates',
        'startsAt',
        'endsAt',
        'electionPublicKey',
        'electionPrivateKey',
        'proposedBy',
        'requiredApprovals',
      ];
      for (const k of required) {
        if (data[k] === undefined) return { ok: false, error: `missing data.${k}` };
      }
      if (!Array.isArray(data.districts) || (data.districts as unknown[]).length === 0) {
        return { ok: false, error: 'data.districts must be a non-empty array' };
      }
      if (!Array.isArray(data.candidates) || (data.candidates as unknown[]).length === 0) {
        return { ok: false, error: 'data.candidates must be a non-empty array' };
      }
      const candidates = data.candidates as Array<{ id?: unknown; name?: unknown }>;
      if (
        !candidates.every(
          (c) => c && typeof c.id === 'string' && typeof c.name === 'string',
        )
      ) {
        return { ok: false, error: 'each candidate must have a string id and name' };
      }
      if (
        Number.isNaN(Date.parse(String(data.startsAt))) ||
        Number.isNaN(Date.parse(String(data.endsAt)))
      ) {
        return { ok: false, error: 'startsAt and endsAt must be valid ISO dates' };
      }
      return { ok: true, computedAction: action };
    }

    case 'ELECTION_APPROVED': {
      const e = state.elections[action.electionId];
      if (!e) return { ok: false, error: 'election not found' };
      if (e.status !== 'PROPOSED') {
        return { ok: false, error: `cannot approve in status ${e.status}` };
      }
      const inst = String(data.institutionId || '');
      if (!inst) return { ok: false, error: 'data.institutionId required' };
      if (e.approvals.some((a) => a.institutionId === inst)) {
        return { ok: false, error: `institution ${inst} already approved` };
      }
      if (typeof data.approvedAt !== 'string') {
        return { ok: false, error: 'data.approvedAt required' };
      }
      return { ok: true, computedAction: action };
    }

    case 'ELECTION_OPENED': {
      const e = state.elections[action.electionId];
      if (!e) return { ok: false, error: 'election not found' };
      if (e.status !== 'APPROVED') {
        return { ok: false, error: `cannot open in status ${e.status}` };
      }
      return { ok: true, computedAction: action };
    }

    case 'ELECTION_FROZEN': {
      const e = state.elections[action.electionId];
      if (!e) return { ok: false, error: 'election not found' };
      if (e.status !== 'OPEN') {
        return { ok: false, error: `cannot freeze in status ${e.status}` };
      }
      return { ok: true, computedAction: action };
    }

    case 'VOTE_CAST': {
      const e = state.elections[action.electionId];
      if (!e) return { ok: false, error: 'election not found' };
      if (e.status !== 'OPEN') {
        return { ok: false, error: `election is not OPEN (current: ${e.status})` };
      }
      const districtId = String(data.districtId || '');
      const anonymousTokenHash = String(data.anonymousTokenHash || '');
      const candidateId = String(data.candidateId || '');
      const encryptedVote =
        data.encryptedVote || (candidateId ? `mock-encrypted:${candidateId}` : '');
      const proof = String(data.proof || data.voterProof || '');
      const encryptedDigitalId = data.encryptedDigitalId;
      const voteTimestamp = String(data.voteTimestamp || data.timestamp || '');

      if (!districtId) return { ok: false, error: 'data.districtId required' };
      if (!e.districts.includes(districtId)) {
        return { ok: false, error: `district ${districtId} does not belong to this election` };
      }
      if (!anonymousTokenHash) return { ok: false, error: 'data.anonymousTokenHash required' };
      if (!encryptedVote) return { ok: false, error: 'data.encryptedVote required' };
      if (!proof) return { ok: false, error: 'data.proof (or voterProof) required' };
      const digitalIdCheck = validatorVoteVerificationService.verifyEncryptedDigitalId(
        e,
        encryptedDigitalId,
      );
      if (!digitalIdCheck.ok) {
        return { ok: false, error: digitalIdCheck.error };
      }
      if (!voteTimestamp) return { ok: false, error: 'data.voteTimestamp (or timestamp) required' };

      const ts = Date.parse(voteTimestamp);
      const startsAt = Date.parse(e.startsAt);
      const endsAt = Date.parse(e.endsAt);
      if (Number.isNaN(ts) || ts < startsAt || ts > endsAt) {
        return { ok: false, error: 'voteTimestamp is outside the election window' };
      }

      const used = state.usedTokensByElection[action.electionId] || [];
      if (used.includes(anonymousTokenHash)) {
        return { ok: false, error: 'Token already used. Re-voting is not supported.' };
      }

      const decoded = decodeVote(encryptedVote, action.electionId, e.candidates);
      if (!decoded.ok) {
        return { ok: false, error: decoded.error };
      }
      // Echo back a normalised payload so all validators sign the same bytes.
      return {
        ok: true,
        computedAction: {
          type: 'VOTE_CAST',
          electionId: action.electionId,
          data: {
            districtId,
            anonymousTokenHash,
            candidateId: candidateId || undefined,
            encryptedVote,
            encryptedDigitalId,
            digitalIdHash: digitalIdCheck.digitalIdHash,
            proof,
            voteTimestamp,
          },
        },
      };
    }

    case 'ELECTION_TALLY_AGGREGATED': {
      const e = state.elections[action.electionId];
      if (!e) return { ok: false, error: 'election not found' };
      if (e.status !== 'FROZEN') {
        return { ok: false, error: `cannot aggregate in status ${e.status}` };
      }
      // Validators compute the aggregate themselves. The gateway picks the
      // majority result before sending /commit.
      const aggregate = computeAggregate(state.blocks, e);
      return {
        ok: true,
        computedAction: {
          type: 'ELECTION_TALLY_AGGREGATED',
          electionId: action.electionId,
          data: { ...aggregate },
        },
      };
    }

    case 'ELECTION_THRESHOLD_DECRYPTED': {
      const e = state.elections[action.electionId];
      if (!e) return { ok: false, error: 'election not found' };
      if (e.status !== 'TALLYING') {
        return { ok: false, error: `cannot threshold-decrypt in status ${e.status}` };
      }
      const shares = data.decryptionShares;
      const validatorIds = data.validatorIds;
      if (!Array.isArray(shares) || shares.length < config.consensusThreshold) {
        return {
          ok: false,
          error: `need at least ${config.consensusThreshold} decryption shares; got ${
            Array.isArray(shares) ? shares.length : 0
          }`,
        };
      }
      if (!Array.isArray(validatorIds) || validatorIds.length < config.consensusThreshold) {
        return {
          ok: false,
          error: `need at least ${config.consensusThreshold} distinct validators in decryption set`,
        };
      }
      if (typeof data.combinedShareHash !== 'string' || !data.combinedShareHash) {
        return { ok: false, error: 'data.combinedShareHash required' };
      }
      return { ok: true, computedAction: action };
    }

    case 'ELECTION_FINISHED': {
      const e = state.elections[action.electionId];
      if (!e) return { ok: false, error: 'election not found' };
      if (e.status !== 'DECRYPTED') {
        return { ok: false, error: `cannot finish in status ${e.status}; need DECRYPTED` };
      }
      if (!e.tally) {
        return { ok: false, error: 'election has no decrypted tally yet' };
      }
      return { ok: true, computedAction: action };
    }

    default:
      return { ok: false, error: `unknown action type: ${(action as ActionPayload).type}` };
  }
}
