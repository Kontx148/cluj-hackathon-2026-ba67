import { digitalIdDecryptionService } from './digital-id-crypto';
import { eligibilityService } from './eligibility-service';
import type { Election } from './types';

export type DigitalIdVerificationResult =
  | { ok: true; digitalIdHash: string }
  | { ok: false; error: 'ENCRYPTED_DIGITAL_ID_REQUIRED' | 'DIGITAL_ID_DECRYPTION_FAILED' | 'VOTER_NOT_ELIGIBLE' };

export class ValidatorVoteVerificationService {
  /**
   * Decrypt encryptedDigitalId with the election private key and check local
   * validator eligibility. The raw digital ID is never returned or logged.
   */
  verifyEncryptedDigitalId(
    election: Election,
    encryptedDigitalId: unknown,
  ): DigitalIdVerificationResult {
    if (typeof encryptedDigitalId !== 'string' || encryptedDigitalId.length === 0) {
      return { ok: false, error: 'ENCRYPTED_DIGITAL_ID_REQUIRED' };
    }

    let digitalId: string;
    try {
      digitalId = digitalIdDecryptionService.decryptWithElectionPrivateKey(
        encryptedDigitalId,
        election.electionPrivateKey,
      );
    } catch {
      return { ok: false, error: 'DIGITAL_ID_DECRYPTION_FAILED' };
    }

    if (!eligibilityService.isEligible(digitalId)) {
      return { ok: false, error: 'VOTER_NOT_ELIGIBLE' };
    }

    return {
      ok: true,
      digitalIdHash: eligibilityService.digitalIdHash(digitalId),
    };
  }
}

export const validatorVoteVerificationService = new ValidatorVoteVerificationService();
