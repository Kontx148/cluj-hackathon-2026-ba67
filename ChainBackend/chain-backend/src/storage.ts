import * as fs from 'fs';
import * as path from 'path';
import { config } from './config';
import type { ChainState } from './types';

/**
 * File-backed in-memory chain state.
 *
 * Real validators would use an append-only log + a key-value store
 * (LevelDB, RocksDB, etc.) and snapshot on commit. For the prototype we
 * persist the whole state as JSON on every change.
 */
export class ChainStorage {
  state: ChainState = {
    elections: {},
    usedTokensByElection: {},
    blocks: [],
  };

  load(): void {
    if (config.chainStorageMode !== 'file') return;
    try {
      if (fs.existsSync(config.chainStoragePath)) {
        const raw = fs.readFileSync(config.chainStoragePath, 'utf8');
        const parsed = JSON.parse(raw) as ChainState;
        this.state = {
          elections: parsed.elections || {},
          usedTokensByElection: parsed.usedTokensByElection || {},
          blocks: parsed.blocks || [],
        };
        console.log(
          `[storage] loaded chain from ${config.chainStoragePath} (${this.state.blocks.length} blocks)`,
        );
      } else {
        console.log(`[storage] no existing chain at ${config.chainStoragePath}; starting fresh`);
      }
    } catch (err) {
      console.error('[storage] failed to load chain', err);
    }
  }

  save(): void {
    if (config.chainStorageMode !== 'file') return;
    const dir = path.dirname(config.chainStoragePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      config.chainStoragePath,
      JSON.stringify(this.state, null, 2),
      'utf8',
    );
  }
}

export const storage = new ChainStorage();
