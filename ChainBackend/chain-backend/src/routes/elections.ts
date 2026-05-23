import { Router } from 'express';
import { authenticate } from '../auth';
import * as elections from '../elections';

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
      !body.candidates.every(
        (c: any) => c && typeof c.id === 'string' && typeof c.name === 'string',
      )
    ) {
      return res
        .status(400)
        .json({ error: 'each candidate must have string id and name' });
    }
    if (Number.isNaN(Date.parse(body.startsAt)) || Number.isNaN(Date.parse(body.endsAt))) {
      return res
        .status(400)
        .json({ error: 'startsAt and endsAt must be valid ISO date strings' });
    }
    if (elections.getElection(body.electionId)) {
      return res.status(409).json({ error: 'electionId already exists' });
    }

    try {
      const result = await elections.proposeElection(body, proposedBy);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || String(err) });
    }
  },
);

router.get('/', (_req, res) => {
  res.json({ elections: elections.listElections() });
});

router.get('/:id', (req, res) => {
  const e = elections.getElection(req.params.id);
  if (!e) return res.status(404).json({ error: 'Election not found' });
  res.json(e);
});

router.get('/:id/approvals', (req, res) => {
  const e = elections.getElection(req.params.id);
  if (!e) return res.status(404).json({ error: 'Election not found' });
  res.json({
    electionId: e.electionId,
    requiredApprovals: e.requiredApprovals,
    approvals: e.approvals,
    status: e.status,
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
    try {
      const result = await elections.approveElection(req.params.id, institutionId);
      res.json(result);
    } catch (err: any) {
      const msg = err.message || String(err);
      const status = msg === 'Election not found' ? 404 : 400;
      res.status(status).json({ error: msg });
    }
  },
);

router.post('/:id/open', authenticate(), async (req, res) => {
  try {
    const result = await elections.openElection(req.params.id);
    res.json(result);
  } catch (err: any) {
    const msg = err.message || String(err);
    const status = msg === 'Election not found' ? 404 : 400;
    res.status(status).json({ error: msg });
  }
});

router.post('/:id/freeze', authenticate(), async (req, res) => {
  try {
    const result = await elections.freezeElection(req.params.id);
    res.json(result);
  } catch (err: any) {
    const msg = err.message || String(err);
    const status = msg === 'Election not found' ? 404 : 400;
    res.status(status).json({ error: msg });
  }
});

router.post('/:id/tally', authenticate(), async (req, res) => {
  try {
    const result = await elections.tallyElection(req.params.id);
    res.json(result);
  } catch (err: any) {
    const msg = err.message || String(err);
    const status = msg === 'Election not found' ? 404 : 400;
    res.status(status).json({ error: msg });
  }
});

router.post('/:id/finish', authenticate(), async (req, res) => {
  try {
    const result = await elections.finishElection(req.params.id);
    res.json(result);
  } catch (err: any) {
    const msg = err.message || String(err);
    const status = msg === 'Election not found' ? 404 : 400;
    res.status(status).json({ error: msg });
  }
});

export default router;
