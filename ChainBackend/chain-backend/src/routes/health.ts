import { Router } from 'express';
import { config } from '../config';
import { storage } from '../storage';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'chain-backend',
    time: new Date().toISOString(),
    consensusThreshold: config.consensusThreshold,
    validators: config.validatorUrls,
    blocks: storage.state.blocks.length,
    elections: Object.keys(storage.state.elections).length,
  });
});

export default router;
