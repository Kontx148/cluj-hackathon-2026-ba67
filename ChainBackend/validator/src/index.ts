import { createHash } from 'crypto';
import express, { type Request, type Response } from 'express';

/**
 * Mock validator node.
 *
 * Each validator simulates an independent institution running a node
 * that:
 *   - validates proposed transactions for structural / policy correctness
 *   - signs proposed blocks with its (mock) private key
 *
 * For the prototype "signing" is sha256(privateKey || canonicalContent).
 *
 * TODO: replace with a real signing scheme (ECDSA-secp256k1 / Ed25519 /
 * BLS12-381) and integrate with the institution's HSM.
 */

const PORT = Number(process.env.PORT || 4101);
const VALIDATOR_ID = process.env.VALIDATOR_ID || 'validator-unknown';
const PRIVATE_KEY = process.env.VALIDATOR_PRIVATE_KEY || 'mock-key';

function deterministicStringify(value: unknown): string {
  if (value === null || value === undefined) return JSON.stringify(value ?? null);
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return '[' + value.map(deterministicStringify).join(',') + ']';
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return (
    '{' +
    keys
      .map((k) => JSON.stringify(k) + ':' + deterministicStringify(obj[k]))
      .join(',') +
    '}'
  );
}

function sign(canonicalContent: string): string {
  return createHash('sha256')
    .update(`${VALIDATOR_ID}::${PRIVATE_KEY}::${canonicalContent}`)
    .digest('hex');
}

interface ValidatorResponse {
  validatorId: string;
  approved: boolean;
  signature?: string;
  reason?: string;
}

function approve(canonicalContent: string): ValidatorResponse {
  return {
    validatorId: VALIDATOR_ID,
    approved: true,
    signature: sign(canonicalContent),
  };
}

function reject(reason: string): ValidatorResponse {
  return { validatorId: VALIDATOR_ID, approved: false, reason };
}

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'validator',
    validatorId: VALIDATOR_ID,
    time: new Date().toISOString(),
  });
});

app.get('/status', (_req: Request, res: Response) => {
  res.json({
    validatorId: VALIDATOR_ID,
    ready: true,
    port: PORT,
  });
});

/**
 * POST /validate-transaction
 * body: { transaction: { ...tx } }
 *
 * Returns { validatorId, approved, signature?, reason? }.
 */
app.post('/validate-transaction', (req: Request, res: Response) => {
  const tx = req.body?.transaction;
  if (!tx || typeof tx !== 'object') {
    return res.json(reject('Missing or invalid `transaction` field'));
  }

  const errors: string[] = [];
  if (!tx.electionId) errors.push('electionId missing');
  if (!tx.timestamp) errors.push('timestamp missing');
  if (!tx.type) errors.push('type missing');

  if (tx.type === 'VOTE_CAST') {
    if (!tx.districtId) errors.push('districtId missing');
    if (!tx.anonymousTokenHash) errors.push('anonymousTokenHash missing');
    if (!tx.encryptedVote) errors.push('encryptedVote missing');
    if (!tx.proof) errors.push('proof missing');
  }

  if (errors.length > 0) {
    return res.json(reject(errors.join('; ')));
  }

  res.json(approve(deterministicStringify(tx)));
});

/**
 * POST /sign-block
 * body: { block: { blockNumber, previousHash, timestamp, transactions } }
 */
app.post('/sign-block', (req: Request, res: Response) => {
  const block = req.body?.block;
  if (!block || typeof block !== 'object') {
    return res.json(reject('Missing or invalid `block` field'));
  }

  const errors: string[] = [];
  if (typeof block.previousHash !== 'string' || !block.previousHash) {
    errors.push('previousHash missing');
  }
  if (!Array.isArray(block.transactions)) {
    errors.push('transactions missing');
  }
  if (typeof block.timestamp !== 'string' || !block.timestamp) {
    errors.push('timestamp missing');
  }
  if (typeof block.blockNumber !== 'number') {
    errors.push('blockNumber missing');
  }

  if (errors.length > 0) {
    return res.json(reject(errors.join('; ')));
  }

  res.json(
    approve(
      deterministicStringify({
        blockNumber: block.blockNumber,
        previousHash: block.previousHash,
        timestamp: block.timestamp,
        transactions: block.transactions,
      }),
    ),
  );
});

app.listen(PORT, () => {
  console.log(`[${VALIDATOR_ID}] listening on :${PORT}`);
});
