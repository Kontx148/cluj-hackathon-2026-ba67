import { Router } from 'express';
import { config } from '../config';
import { mockDecryptionShare } from '../crypto';
import { storage } from '../storage';

const router = Router();

/**
 * POST /threshold-decryption/share
 *
 * Body: { electionId }
 *
 * Returns this validator's mock partial decryption share for the requested
 * election's encrypted aggregate.
 *
 * In production each validator would hold a key share (DKG output) and
 * produce a partial decryption of the aggregate ciphertext. ≥ threshold
 * shares are then combined (Lagrange interpolation) to recover the
 * cleartext tally without ever revealing individual ballots.
 *
 * TODO: replace with real threshold ElGamal / Paillier partial decryption.
 */
router.post('/share', (req, res) => {
  const electionId = req.body?.electionId;
  if (typeof electionId !== 'string' || !electionId) {
    return res.status(400).json({
      validatorId: config.validatorId,
      error: 'electionId required',
    });
  }
  const election = storage.state.elections[electionId];
  if (!election) {
    return res.status(404).json({
      validatorId: config.validatorId,
      error: 'election not found',
    });
  }
  if (election.status !== 'TALLYING') {
    return res.status(409).json({
      validatorId: config.validatorId,
      error: `election is not in TALLYING status (current: ${election.status})`,
    });
  }
  if (!election.tallyAggregate) {
    return res.status(409).json({
      validatorId: config.validatorId,
      error: 'election has no aggregated tally yet',
    });
  }

  const share = mockDecryptionShare(
    electionId,
    election.tallyAggregate.encryptedAggregateMock,
  );
  res.json({
    validatorId: config.validatorId,
    electionId,
    partialDecryptionShare: share,
  });
});

export default router;
