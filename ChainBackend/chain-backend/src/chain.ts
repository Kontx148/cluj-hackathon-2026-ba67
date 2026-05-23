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
 * Create the genesis block if the chain is empty.
 *
 * Genesis is exempt from the validator-signature consensus requirement so
 * that a freshly bootstrapped chain has a stable anchor before any
 * validator network is reachable.
 */
export function ensureGenesis(): void {
  if (storage.state.blocks.length > 0) return;
  const ts = new Date().toISOString();
  const genesis: Block = {
    blockNumber: 0,
    previousHash: '0'.repeat(64),
    timestamp: ts,
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
