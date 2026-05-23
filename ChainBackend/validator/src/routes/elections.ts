import { Router } from 'express';
import { storage } from '../storage';
import { publicElectionView } from '../public-view';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    elections: Object.values(storage.state.elections).map(publicElectionView),
  });
});

router.get('/:id', (req, res) => {
  const e = storage.state.elections[req.params.id];
  if (!e) return res.status(404).json({ error: 'Election not found' });
  res.json(publicElectionView(e));
});

export default router;
