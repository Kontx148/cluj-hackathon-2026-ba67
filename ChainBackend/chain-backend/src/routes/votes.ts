import { Router } from 'express';
import * as elections from '../elections';

const router = Router();

/**
 * Vote submission is intentionally unauthenticated at the institution
 * level: real elections must accept votes from citizens. Authorization is
 * instead enforced by:
 *   - the anonymousTokenHash (one-time-use credential issued out of band)
 *   - the proof field (zk-proof of eligibility, mocked here)
 */
router.post('/', async (req, res) => {
  const result = await elections.castVote(req.body || {});
  if (!result.ok) {
    return res.status(result.status).json({
      error: result.error,
      validations: result.validations,
      signatures: result.signatures,
    });
  }
  res.status(201).json({
    accepted: true,
    transaction: result.transaction,
    block: {
      blockNumber: result.block.blockNumber,
      blockHash: result.block.blockHash,
      previousHash: result.block.previousHash,
      validatorSignatures: result.block.validatorSignatures,
    },
    validations: result.validations,
    signatures: result.signatures,
  });
});

export default router;
