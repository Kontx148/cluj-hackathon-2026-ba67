import { apiFetch, ApiError } from './client';
import type { ChainBlock, ChainTransaction, ChainVerifyResponse } from './types';

export function getBlock(blockNumber: number): Promise<ChainBlock> {
  return apiFetch<ChainBlock>(`/chain/blocks/${blockNumber}`);
}

/**
 * Fetch a block by its `blockHash`.
 *
 * Prefers the dedicated `GET /chain/blocks/by-hash/:hash` endpoint, but
 * gracefully falls back to scanning the full block list when the gateway
 * doesn't yet expose it (the deployed instance returns 404 today). The
 * fallback lets the dashboard work against an unredeployed backend; once
 * the route is live the first branch takes over automatically.
 */
export async function getBlockByHash(hash: string): Promise<ChainBlock> {
  try {
    return await apiFetch<ChainBlock>(
      `/chain/blocks/by-hash/${encodeURIComponent(hash)}`,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      // Could be either "endpoint not implemented" or "hash not on chain".
      // Try the scan; if that also fails to find it, surface a real 404.
      const blocks = await listBlocks();
      const found = blocks.find((b) => b.blockHash === hash);
      if (found) return found;
      throw new ApiError(404, `No block with hash ${hash}`);
    }
    throw err;
  }
}

/**
 * The gateway wraps the list endpoint as `{ blocks, consistent, ... }`.
 * Returns the unwrapped array, sorted by `blockNumber` ascending.
 */
export async function listBlocks(): Promise<ChainBlock[]> {
  const raw = await apiFetch<
    ChainBlock[] | { blocks?: ChainBlock[] } | undefined
  >('/chain/blocks');
  const list = Array.isArray(raw) ? raw : raw?.blocks ?? [];
  return [...list].sort((a, b) => a.blockNumber - b.blockNumber);
}

export function getTransaction(hash: string): Promise<ChainTransaction> {
  return apiFetch<ChainTransaction>(
    `/chain/transactions/${encodeURIComponent(hash)}`,
  );
}

/**
 * Per the gateway: `GET /chain/elections/:electionId/transactions` is the
 * canonical lookup for "what transactions belong to this election?".
 * Returns the unwrapped array.
 */
export async function listElectionTransactions(
  electionId: string,
): Promise<ChainTransaction[]> {
  const raw = await apiFetch<
    | ChainTransaction[]
    | { transactions?: ChainTransaction[] }
    | undefined
  >(`/chain/elections/${encodeURIComponent(electionId)}/transactions`);
  if (Array.isArray(raw)) return raw;
  return raw?.transactions ?? [];
}

export function verifyChain(): Promise<ChainVerifyResponse> {
  return apiFetch<ChainVerifyResponse>('/chain/verify');
}

/**
 * The gateway does not (yet) expose a vote-count endpoint, so the dashboard
 * derives counts client-side from the chain. Counts `VOTE_CAST` transactions
 * per `electionId` across every block.
 */
export function computeVoteCounts(
  blocks: ChainBlock[] | undefined,
): Map<string, number> {
  const counts = new Map<string, number>();
  if (!blocks) return counts;
  for (const block of blocks) {
    for (const tx of block.transactions ?? []) {
      if (tx.type !== 'VOTE_CAST') continue;
      const eid = typeof tx.electionId === 'string' ? tx.electionId : null;
      if (!eid) continue;
      counts.set(eid, (counts.get(eid) ?? 0) + 1);
    }
  }
  return counts;
}

export function getElectionChain(
  electionId: string,
): Promise<{ blocks?: ChainBlock[]; transactions?: ChainTransaction[] }> {
  return apiFetch(`/chain/elections/${encodeURIComponent(electionId)}`);
}
