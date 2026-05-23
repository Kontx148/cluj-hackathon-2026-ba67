import { Router } from 'express';
import { config } from '../config';
import { storage } from '../storage';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'validator',
    validatorId: config.validatorId,
    time: new Date().toISOString(),
    blocks: storage.state.blocks.length,
  });
});

router.get('/status', (_req, res) => {
  const head = storage.state.blocks[storage.state.blocks.length - 1];
  res.json({
    validatorId: config.validatorId,
    ready: true,
    port: config.port,
    blocks: storage.state.blocks.length,
    head: head?.blockHash ?? null,
    consensusThreshold: config.consensusThreshold,
    peers: config.validatorUrls,
  });
});

export default router;
