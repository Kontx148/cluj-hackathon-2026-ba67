import type { Candidate } from '../api/types';

export interface VoteChoiceDisplay {
  candidateId: string | null;
  candidateName: string | null;
  districtId: string | null;
  /** Human-readable one-liner for summaries. */
  summary: string;
}

/**
 * Resolve who was voted for from on-chain VOTE_CAST data.
 * Mobile votes often only persist `encryptedVote` (mock-enc vector), not candidateId.
 */
export function resolveVoteChoice(
  data: Record<string, unknown>,
  electionId: string | undefined,
  candidates: Candidate[] | undefined,
): VoteChoiceDisplay {
  const districtId =
    typeof data.districtId === 'string' && data.districtId
      ? data.districtId
      : null;

  let candidateId =
    typeof data.candidateId === 'string' && data.candidateId
      ? data.candidateId
      : null;

  const encryptedVote =
    typeof data.encryptedVote === 'string' ? data.encryptedVote : '';

  if (!candidateId && encryptedVote) {
    candidateId = candidateIdFromEncryptedVote(encryptedVote, electionId);
  }

  let candidateName: string | null = null;
  if (candidateId && candidates?.length) {
    const match = candidates.find((c) => c.id === candidateId);
    candidateName = match?.name ?? null;
  }

  const voteLabel = candidateName
    ? `${candidateName} (${candidateId})`
    : candidateId
      ? candidateId
      : encryptedVote
        ? 'unknown (see encrypted vote)'
        : '—';

  const districtPart = districtId ? ` · district ${districtId}` : '';
  const summary = `Vote → ${voteLabel}${districtPart}`;

  return {
    candidateId,
    candidateName,
    districtId,
    summary,
  };
}

function candidateIdFromEncryptedVote(
  encryptedVote: string,
  electionId?: string,
): string | null {
  if (encryptedVote.startsWith('mock-encrypted:')) {
    const id = encryptedVote.slice('mock-encrypted:'.length).trim();
    return id || null;
  }

  let vector: number[] | null = null;

  if (encryptedVote.startsWith('mock-enc:')) {
    const rest = encryptedVote.slice('mock-enc:'.length);
    const colonIdx = rest.indexOf(':');
    if (colonIdx < 0) return null;
    const innerEid = rest.slice(0, colonIdx);
    if (electionId && innerEid !== electionId) return null;
    vector = parseVectorJson(rest.slice(colonIdx + 1));
  } else if (encryptedVote.startsWith('mock-encrypted-vector:')) {
    vector = parseVectorJson(
      encryptedVote.slice('mock-encrypted-vector:'.length),
    );
  }

  if (!vector) return null;
  const idx = vector.findIndex((x) => x === 1);
  if (idx < 0) return null;
  return `candidate-index-${idx}`;
}

function parseVectorJson(s: string): number[] | null {
  try {
    const v = JSON.parse(s);
    if (!Array.isArray(v) || !v.every((x) => typeof x === 'number')) return null;
    return v as number[];
  } catch {
    return null;
  }
}

/** Map vector index to election candidate id when candidateId was not stored. */
export function candidateIdFromIndex(
  candidates: Candidate[],
  index: number,
): string | null {
  if (index < 0 || index >= candidates.length) return null;
  return candidates[index]?.id ?? null;
}

export function resolveVoteChoiceWithElection(
  data: Record<string, unknown>,
  electionId: string | undefined,
  candidates: Candidate[],
): VoteChoiceDisplay {
  let base = resolveVoteChoice(data, electionId, candidates);

  if (
    base.candidateId?.startsWith('candidate-index-') &&
    candidates.length > 0
  ) {
    const idx = Number(base.candidateId.replace('candidate-index-', ''));
    if (Number.isInteger(idx)) {
      const id = candidateIdFromIndex(candidates, idx);
      if (id) {
        const match = candidates.find((c) => c.id === id);
        base = {
          ...base,
          candidateId: id,
          candidateName: match?.name ?? null,
          summary: `Vote → ${match?.name ?? id} (${id})${
            base.districtId ? ` · district ${base.districtId}` : ''
          }`,
        };
      }
    }
  }

  return base;
}
