import axios from 'axios';
import { config } from './config';

export interface ValidatorResponse {
  validatorId: string;
  approved: boolean;
  signature?: string;
  reason?: string;
}

async function callValidator(
  url: string,
  path: string,
  body: unknown,
): Promise<ValidatorResponse> {
  try {
    const res = await axios.post(`${url}${path}`, body, { timeout: 5000 });
    const data = res.data as ValidatorResponse;
    return {
      validatorId: data.validatorId || url,
      approved: Boolean(data.approved),
      signature: data.signature,
      reason: data.reason,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      validatorId: url,
      approved: false,
      reason: `Validator unreachable: ${msg}`,
    };
  }
}

/**
 * Ask all configured validators to validate a proposed transaction.
 * The chain-backend collects approvals to decide whether to attempt to
 * build a block at all.
 *
 * TODO: replace with a real BFT message round (PBFT / HotStuff style) where
 * each validator signs a "prepare" message and the leader collects 2f+1
 * such messages before producing a block proposal.
 */
export async function validateTransactionWithAll(
  transaction: unknown,
): Promise<ValidatorResponse[]> {
  return Promise.all(
    config.validatorUrls.map((url) =>
      callValidator(url, '/validate-transaction', { transaction }),
    ),
  );
}

/**
 * Ask all validators to sign a proposed block. Each validator returns a
 * mock signature (sha256 over its private key + content).
 *
 * TODO: replace with real ECDSA / BLS signatures over the canonical block
 * content, and aggregate signatures (BLS) to keep blocks compact.
 */
export async function signBlockWithAll(block: unknown): Promise<ValidatorResponse[]> {
  return Promise.all(
    config.validatorUrls.map((url) => callValidator(url, '/sign-block', { block })),
  );
}
