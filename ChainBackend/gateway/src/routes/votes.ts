import { Router } from 'express';
import { runConsensus } from '../consensus';

const router = Router();

/**
 * POST /votes
 *
 * Citizen-facing endpoint. The encryptedVote is expected to be one of:
 *   1. mock-enc:<electionId>:[1,0,0]        ← preferred, tied to election
 *   2. mock-encrypted-vector:[1,0,0]
 *   3. mock-encrypted:<candidateId>         ← legacy single-candidate
 *
 * Validators run the full vote-vector + token + window checks before
 * approving. They also decrypt encryptedDigitalId using the election private
 * key and check local voter eligibility. The gateway never sees the raw
 * digital ID.
 */
router.post('/', async (req, res) => {
  const body = req.body || {};
  const required = [
    'electionId',
    'districtId',
    'anonymousTokenHash',
    'encryptedDigitalId',
    'timestamp',
  ];
  for (const k of required) {
    if (body[k] === undefined) return res.status(400).json({ error: `Missing field: ${k}` });
  }
  if (body.encryptedVote === undefined && body.candidateId === undefined) {
    return res.status(400).json({ error: 'Missing field: encryptedVote or candidateId' });
  }
  if (body.proof === undefined && body.voterProof === undefined) {
    return res.status(400).json({ error: 'Missing field: proof or voterProof' });
  }
  const consensus = await runConsensus({
    type: 'VOTE_CAST',
    electionId: body.electionId,
    data: {
      districtId: body.districtId,
      anonymousTokenHash: body.anonymousTokenHash,
      candidateId: body.candidateId,
      encryptedVote: body.encryptedVote,
      encryptedDigitalId: body.encryptedDigitalId,
      proof: body.proof,
      voterProof: body.voterProof,
      voteTimestamp: body.timestamp,
    },
  });
  if (!consensus.ok) {
    const validatorReasons = consensus.prepare
      .filter((p) => !p.approved)
      .map((p) => p.reason)
      .filter((r): r is string => Boolean(r));

    // Surface duplicate-token rejection with the canonical 409 status
    // expected by clients.
    if (validatorReasons.some((r) => r.includes('Token already used'))) {
      return res.status(409).json({
        error: 'Token already used. Re-voting is not supported.',
        validatorReasons,
        consensus,
      });
    }
    if (validatorReasons.some((r) => r === 'VOTER_NOT_ELIGIBLE')) {
      return res.status(403).json({
        error: 'VOTER_NOT_ELIGIBLE',
        validatorReasons,
        consensus,
      });
    }

    // If every validator rejected at prepare, treat as a 400 (content
    // problem). If validators agreed but failed to commit, treat as 502.
    const allRejected = consensus.prepare.every((p) => !p.approved);
    if (allRejected) {
      return res.status(400).json({
        error: validatorReasons[0] || consensus.reason || 'Vote rejected by validators',
        validatorReasons,
        consensus,
      });
    }
    return res.status(502).json({ error: consensus.reason, consensus });
  }
  res.status(201).json({
    accepted: true,
    transaction: consensus.agreedAction,
    block: consensus.block,
    consensus,
  });
});

export default router;
