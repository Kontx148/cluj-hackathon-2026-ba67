import { Router } from 'express';
import { appendBlock, getLatestBlock } from '../chain';
import { config } from '../config';
import { deterministicStringify, hashBlock, hashTransaction, mockSign } from '../crypto';
import { applyTransaction } from '../state';
import { storage } from '../storage';
import { validateAction } from '../validate';
import type { ActionPayload, Block, Transaction, ValidatorSignature } from '../types';

const router = Router();

interface PendingProposal {
  proposalId: string;
  proposedAt: string;
  computedAction: ActionPayload;
  signature: string;
}

const pending = new Map<string, PendingProposal>();

/**
 * POST /consensus/prepare
 *
 * Body: { proposalId, proposedAt, action }
 *
 * The validator runs precondition checks against its local state. For
 * derived actions (like ELECTION_TALLY_AGGREGATED) the validator computes
 * the full payload from its chain and returns it as `computedAction`. The
 * gateway then picks the majority `computedAction` and uses it for /commit.
 *
 * Returns: { validatorId, proposalId, approved, signature?, computedAction?, reason? }
 */
router.post('/prepare', (req, res) => {
  const { proposalId, proposedAt, action } = req.body || {};
  if (typeof proposalId !== 'string' || !proposalId) {
    return res.status(400).json({
      validatorId: config.validatorId,
      proposalId: null,
      approved: false,
      reason: 'proposalId required',
    });
  }
  if (typeof proposedAt !== 'string' || Number.isNaN(Date.parse(proposedAt))) {
    return res.status(400).json({
      validatorId: config.validatorId,
      proposalId,
      approved: false,
      reason: 'proposedAt required (ISO timestamp)',
    });
  }
  if (!action || typeof action !== 'object') {
    return res.status(400).json({
      validatorId: config.validatorId,
      proposalId,
      approved: false,
      reason: 'action required',
    });
  }

  const result = validateAction(storage.state, action as ActionPayload);
  if (!result.ok) {
    return res.json({
      validatorId: config.validatorId,
      proposalId,
      approved: false,
      reason: result.error,
    });
  }

  const computedAction = result.computedAction;
  const signaturePayload = deterministicStringify({
    proposalId,
    proposedAt,
    action: computedAction,
  });
  const signature = mockSign(signaturePayload);

  pending.set(proposalId, { proposalId, proposedAt, computedAction, signature });

  res.json({
    validatorId: config.validatorId,
    proposalId,
    approved: true,
    signature,
    computedAction,
  });
});

/**
 * POST /consensus/commit
 *
 * Body: { proposalId, proposedAt, action, signatures: [{validatorId, signature}, ...] }
 *
 * Validator deterministically constructs the next block from the agreed
 * payload (so all validators produce identical blockHashes), applies the
 * state machine, persists, and returns the new block summary.
 */
router.post('/commit', (req, res) => {
  const { proposalId, proposedAt, action, signatures } = req.body || {};
  if (
    typeof proposalId !== 'string' ||
    typeof proposedAt !== 'string' ||
    !action ||
    !Array.isArray(signatures)
  ) {
    return res.status(400).json({
      validatorId: config.validatorId,
      proposalId: proposalId || null,
      committed: false,
      reason: 'proposalId, proposedAt, action, signatures required',
    });
  }

  if (signatures.length < config.consensusThreshold) {
    return res.json({
      validatorId: config.validatorId,
      proposalId,
      committed: false,
      reason: `insufficient signatures (${signatures.length}/${config.consensusThreshold})`,
    });
  }

  // Re-validate the agreed action against current state. This catches the
  // case where a competing commit (e.g. duplicate-token race) already moved
  // our state.
  const validation = validateAction(storage.state, action as ActionPayload);
  if (!validation.ok) {
    return res.json({
      validatorId: config.validatorId,
      proposalId,
      committed: false,
      reason: validation.error,
    });
  }

  const tx = buildTransaction(action as ActionPayload, proposalId, proposedAt);

  const previous = getLatestBlock();
  const block: Block = {
    blockNumber: (previous?.blockNumber ?? -1) + 1,
    previousHash: previous?.blockHash ?? '0'.repeat(64),
    timestamp: proposedAt,
    transactions: [tx],
    validatorSignatures: signatures as ValidatorSignature[],
    blockHash: '',
  };
  block.blockHash = hashBlock(block);

  appendBlock(block);
  applyTransaction(storage.state, tx);
  storage.save();

  pending.delete(proposalId);

  res.json({
    validatorId: config.validatorId,
    proposalId,
    committed: true,
    blockNumber: block.blockNumber,
    blockHash: block.blockHash,
  });
});

function buildTransaction(
  action: ActionPayload,
  proposalId: string,
  proposedAt: string,
): Transaction {
  const draft: Record<string, unknown> = {
    type: action.type,
    electionId: action.electionId,
    data: action.data,
    proposalId,
    proposedAt,
    transactionHash: '',
  };
  draft.transactionHash = hashTransaction(draft);
  return draft as unknown as Transaction;
}

export default router;
