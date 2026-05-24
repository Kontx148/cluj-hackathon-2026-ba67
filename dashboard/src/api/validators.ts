import { apiFetch } from './client';
import type {
  RawValidatorEntry,
  RawValidatorStatusResponse,
  ValidatorStatusEntry,
  ValidatorStatusResponse,
} from './types';

/**
 * Derive the short validator id from a raw entry. Falls back to a sensible
 * placeholder if the gateway couldn't reach the validator (no `data`).
 */
function shortIdFor(entry: RawValidatorEntry, index: number): string {
  if (entry.data?.validatorId) return entry.data.validatorId;
  const match = entry.url?.match(/validator-\d+/);
  if (match) return match[0];
  return `validator-${index + 1}`;
}

function flattenEntry(
  entry: RawValidatorEntry,
  index: number,
): ValidatorStatusEntry {
  return {
    validatorId: shortIdFor(entry, index),
    url: entry.url,
    reachable: !!entry.ok,
    valid: !!entry.data?.ready,
    blockCount: entry.data?.blocks,
    head: entry.data?.head,
    error: entry.error,
  };
}

export async function getValidatorStatus(): Promise<ValidatorStatusResponse> {
  const raw = await apiFetch<RawValidatorStatusResponse>('/validators/status');
  const validators = (raw.validators ?? []).map(flattenEntry);

  const reachable = validators.filter((v) => v.reachable);
  // "consistent" here means: every validator we could reach reports itself ready.
  // We don't penalise the summary if a single validator is offline — the dot
  // colour for that row already conveys it.
  const consistent =
    reachable.length === validators.length &&
    reachable.every((v) => v.valid);
  // "allHeadsMatch" compares heads only across the validators we could reach.
  const heads = new Set(
    reachable.map((v) => v.head).filter((h): h is string => !!h),
  );
  const allHeadsMatch =
    reachable.length > 0 && reachable.length === validators.length && heads.size === 1;

  return {
    validators,
    consistent,
    allHeadsMatch,
    gatewayId: raw.gatewayId,
    consensusThreshold: raw.consensusThreshold,
  };
}
