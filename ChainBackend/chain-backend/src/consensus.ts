import { appendBlock, getLatestBlock } from './chain';
import { config } from './config';
import { hashBlock, hashTransaction } from './crypto';
import {
  signBlockWithAll,
  validateTransactionWithAll,
  type ValidatorResponse,
} from './validators-client';
import type {
  Block,
  SystemTransaction,
  Transaction,
  ValidatorSignature,
  VoteTransaction,
} from './types';

export interface ConsensusOutcome {
  block?: Block;
  validations: ValidatorResponse[];
  signatures: ValidatorResponse[];
  rejected?: { reason: string };
}

type TransactionInput =
  | (Omit<VoteTransaction, 'transactionHash'>)
  | (Omit<SystemTransaction, 'transactionHash'>);

/**
 * Build a single-transaction block, run consensus with validators, and on
 * success append the block to the chain.
 *
 * Real-world chains batch many transactions per block; we use one tx per
 * block here to keep the prototype's audit trail human-readable.
 *
 * TODO: implement mempool + batching, leader election, and a real BFT
 * commit phase (pre-prepare / prepare / commit) instead of this 2-step
 * "validate then sign" simulation.
 */
export async function proposeAndCommit(
  transactionInput: TransactionInput,
): Promise<ConsensusOutcome> {
  const draftTx: Record<string, unknown> = { ...transactionInput, transactionHash: '' };
  draftTx.transactionHash = hashTransaction(draftTx);
  const tx = draftTx as unknown as Transaction;

  const validations = await validateTransactionWithAll(tx);
  const approvedValidators = validations.filter((v) => v.approved).length;
  if (approvedValidators < config.consensusThreshold) {
    return {
      validations,
      signatures: [],
      rejected: {
        reason: `Validator consensus not reached on transaction (${approvedValidators}/${config.consensusThreshold})`,
      },
    };
  }

  const previous = getLatestBlock();
  const proposed: Block = {
    blockNumber: (previous?.blockNumber ?? -1) + 1,
    previousHash: previous?.blockHash ?? '0'.repeat(64),
    timestamp: new Date().toISOString(),
    transactions: [tx],
    validatorSignatures: [],
    blockHash: '',
  };

  const signatures = await signBlockWithAll({
    blockNumber: proposed.blockNumber,
    previousHash: proposed.previousHash,
    timestamp: proposed.timestamp,
    transactions: proposed.transactions,
  });
  const approvedSigs = signatures.filter((s) => s.approved && s.signature);
  if (approvedSigs.length < config.consensusThreshold) {
    return {
      validations,
      signatures,
      rejected: {
        reason: `Validator consensus not reached on block (${approvedSigs.length}/${config.consensusThreshold})`,
      },
    };
  }

  proposed.validatorSignatures = approvedSigs.map<ValidatorSignature>((s) => ({
    validatorId: s.validatorId,
    signature: s.signature as string,
  }));
  proposed.blockHash = hashBlock(proposed);

  appendBlock(proposed);
  return { block: proposed, validations, signatures };
}
