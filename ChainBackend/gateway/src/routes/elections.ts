import { Router } from 'express';
import { authenticate } from '../auth';
import { readMajority } from '../chain-aggregate';
import { runConsensus } from '../consensus';
import { aggregateTally, requestThresholdDecryption } from '../tally-flow';

const router = Router();

router.post(
  '/proposals',
  authenticate({ requireProposer: true }),
  async (req, res) => {
    const proposedBy = req.auth?.institutionId || 'ADMIN';
    const body = req.body || {};
    const required = [
      'electionId',
      'name',
      'type',
      'districts',
      'candidates',
      'startsAt',
      'endsAt',
    ];
    for (const k of required) {
      if (body[k] === undefined) {
        return res.status(400).json({ error: `Missing field: ${k}` });
      }
    }
    if (!Array.isArray(body.districts) || body.districts.length === 0) {
      return res.status(400).json({ error: 'districts must be a non-empty array' });
    }
    if (!Array.isArray(body.candidates) || body.candidates.length === 0) {
      return res.status(400).json({ error: 'candidates must be a non-empty array' });
    }
    if (
      Number.isNaN(Date.parse(body.startsAt)) ||
      Number.isNaN(Date.parse(body.endsAt))
    ) {
      return res
        .status(400)
        .json({ error: 'startsAt and endsAt must be valid ISO dates' });
    }

    const requiredApprovals = Number(body.requiredApprovals ?? 2);
    const electionPublicKey =
      typeof body.electionPublicKey === 'string' && body.electionPublicKey.length > 0
        ? body.electionPublicKey
        : `mock-public-key:${body.electionId}`;

    const consensus = await runConsensus({
      type: 'ELECTION_PROPOSED',
      electionId: body.electionId,
      data: {
        name: body.name,
        type: body.type,
        districts: body.districts,
        candidates: body.candidates,
        startsAt: body.startsAt,
        endsAt: body.endsAt,
        requiredApprovals,
        electionPublicKey,
        proposedBy,
      },
    });
    if (!consensus.ok) {
      return res.status(502).json({ error: consensus.reason, consensus });
    }
    res.status(201).json({
      electionId: body.electionId,
      electionPublicKey,
      consensus,
    });
  },
);

router.get('/', async (_req, res) => {
  const view = await readMajority<{ elections: unknown[] }>('/elections');
  if (!view.result) return res.status(502).json(view);
  res.json({
    elections: view.result.elections,
    consistent: view.consistent,
    warning: view.warning,
    responsiveValidators: view.responsiveValidators,
    totalValidators: view.totalValidators,
  });
});

router.get('/:id', async (req, res) => {
  const view = await readMajority<unknown>(
    `/elections/${encodeURIComponent(req.params.id)}`,
  );
  if (!view.result) return res.status(404).json(view);
  res.json({
    election: view.result,
    consistent: view.consistent,
    warning: view.warning,
    responsiveValidators: view.responsiveValidators,
    totalValidators: view.totalValidators,
  });
});

router.post(
  '/:id/approve',
  authenticate({ requireApprover: true }),
  async (req, res) => {
    const institutionId = req.auth?.institutionId;
    if (!institutionId) {
      return res.status(403).json({
        error:
          'Approvals must be made by an institution. Provide x-institution-id and that institution\'s x-api-key.',
      });
    }
    const consensus = await runConsensus({
      type: 'ELECTION_APPROVED',
      electionId: req.params.id,
      data: {
        institutionId,
        approvedAt: new Date().toISOString(),
      },
    });
    if (!consensus.ok) {
      return res.status(400).json({ error: consensus.reason, consensus });
    }
    res.json({ electionId: req.params.id, institutionId, consensus });
  },
);

router.post('/:id/open', authenticate(), async (req, res) => {
  const consensus = await runConsensus({
    type: 'ELECTION_OPENED',
    electionId: req.params.id,
    data: {},
  });
  if (!consensus.ok) return res.status(400).json({ error: consensus.reason, consensus });
  res.json({ electionId: req.params.id, status: 'OPEN', consensus });
});

router.post('/:id/freeze', authenticate(), async (req, res) => {
  const consensus = await runConsensus({
    type: 'ELECTION_FROZEN',
    electionId: req.params.id,
    data: {},
  });
  if (!consensus.ok) return res.status(400).json({ error: consensus.reason, consensus });
  res.json({ electionId: req.params.id, status: 'FROZEN', consensus });
});

router.post('/:id/tally', authenticate(), async (req, res) => {
  const result = await aggregateTally(req.params.id);
  if (!result.ok) return res.status(result.status).json({ error: result.error, consensus: result.consensus });
  res.json(result.response);
});

router.post('/:id/request-threshold-decryption', authenticate(), async (req, res) => {
  const result = await requestThresholdDecryption(req.params.id);
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error, details: result.details });
  }
  res.json(result.response);
});

router.post('/:id/finish', authenticate(), async (req, res) => {
  const consensus = await runConsensus({
    type: 'ELECTION_FINISHED',
    electionId: req.params.id,
    data: {},
  });
  if (!consensus.ok) return res.status(400).json({ error: consensus.reason, consensus });
  // After FINISHED, GET /elections/:id will start to expose the published tally.
  res.json({ electionId: req.params.id, status: 'FINISHED', consensus });
});

export default router;
