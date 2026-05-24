import * as fs from 'fs';
import { createHash } from 'crypto';
import { config } from './config';

export interface EligibleVoter {
  digitalId: string;
  name?: string;
}

export class EligibilityService {
  private eligibleDigitalIds = new Set<string>();

  load(): void {
    try {
      const raw = fs.readFileSync(config.eligibilityListPath, 'utf8');
      const parsed = JSON.parse(raw) as EligibleVoter[];
      this.eligibleDigitalIds = new Set(
        parsed
          .map((v) => (typeof v.digitalId === 'string' ? v.digitalId : ''))
          .filter(Boolean),
      );
      console.log(
        `[${config.validatorId}] loaded ${this.eligibleDigitalIds.size} eligible voter records`,
      );
    } catch (err) {
      this.eligibleDigitalIds = new Set();
      console.error(
        `[${config.validatorId}] failed to load eligibility list from ${config.eligibilityListPath}`,
        err,
      );
    }
  }

  isEligible(digitalId: string): boolean {
    return this.eligibleDigitalIds.has(digitalId);
  }

  digitalIdHash(digitalId: string): string {
    return createHash('sha256').update(digitalId).digest('hex');
  }
}

export const eligibilityService = new EligibilityService();
