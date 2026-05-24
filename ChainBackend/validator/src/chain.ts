import { hashBlock } from './crypto';
import { storage } from './storage';
import type { Block } from './types';

export function getChain(): Block[] {
  return storage.state.blocks;
}

export function getLatestBlock(): Block | null {
  const blocks = storage.state.blocks;
  return blocks.length > 0 ? blocks[blocks.length - 1] : null;
}

/**
 * Genesis block. Identical across all validators because it has zero
 * transactions, fixed previousHash and a deterministic placeholder
 * timestamp ("1970-01-01T00:00:00.000Z"). Genesis is exempt from the
 * validator-signature consensus requirement at verify time.
 */
export function ensureGenesis(): void {
  if (storage.state.blocks.length > 0) return;
  const genesis: Block = {
    blockNumber: 0,
    previousHash: '0'.repeat(64),
    timestamp: '1970-01-01T00:00:00.000Z',
    transactions: [],
    validatorSignatures: [],
    blockHash: '',
  };
  genesis.blockHash = hashBlock(genesis);
  storage.state.blocks.push(genesis);
  storage.save();
  console.log(`[chain] genesis block created: ${genesis.blockHash}`);
}

export function appendBlock(block: Block): void {
  storage.state.blocks.push(block);
  storage.save();
}
