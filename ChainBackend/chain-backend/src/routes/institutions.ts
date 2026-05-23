import { Router } from 'express';
import { INSTITUTIONS } from '../config';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    institutions: INSTITUTIONS.map((i) => ({
      id: i.id,
      name: i.name,
      canPropose: i.canPropose,
      canApprove: i.canApprove,
    })),
  });
});

export default router;
