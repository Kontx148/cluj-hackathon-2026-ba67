import { Router } from 'express';
import { INSTITUTIONS } from '../config';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ institutions: INSTITUTIONS });
});

export default router;
