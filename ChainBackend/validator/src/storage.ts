import * as fs from 'fs';
import * as path from 'path';
import { config } from './config';
import type { ValidatorState } from './types';

/**
 * Per-validator file-backed chain state.
 *
 * Each validator persists *its own* copy of the chain JSON, so that
 * `docker compose down -v` is the only thing that wipes them all at once.
 *
 * TODO: real validators would use a per-node append-only log + LSM-tree KV
 * store (LevelDB / RocksDB) and snapshot periodically.
 */
class StorageImpl {
  state: ValidatorState = {
    elections: {},
    usedTokensByElection: {},
    blocks: [],
  };

  load(): void {
    try {
      if (fs.existsSync(config.chainStoragePath)) {
        const raw = fs.readFileSync(config.chainStoragePath, 'utf8');
        const parsed = JSON.parse(raw) as ValidatorState;
        this.state = {
          elections: parsed.elections || {},
          usedTokensByElection: parsed.usedTokensByElection || {},
          blocks: parsed.blocks || [],
        };
        console.log(
          `[${config.validatorId}] loaded chain from ${config.chainStoragePath} (${this.state.blocks.length} blocks)`,
        );
      } else {
        console.log(
          `[${config.validatorId}] no existing chain at ${config.chainStoragePath}; starting fresh`,
        );
      }
    } catch (err) {
      console.error(`[${config.validatorId}] failed to load chain`, err);
    }
  }

  save(): void {
    const dir = path.dirname(config.chainStoragePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      config.chainStoragePath,
      JSON.stringify(this.state, null, 2),
      'utf8',
    );
  }
}

export const storage = new StorageImpl();
