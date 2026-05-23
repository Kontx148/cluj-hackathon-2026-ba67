import { Router } from 'express';
import { config } from '../config';
import { broadcastGet } from '../validators-client';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'gateway',
    gatewayId: config.gatewayId,
    time: new Date().toISOString(),
    validators: config.validatorUrls,
    consensusThreshold: config.consensusThreshold,
  });
});

router.get('/validators/status', async (_req, res) => {
  const results = await broadcastGet<unknown>('/status');
  res.json({
    gatewayId: config.gatewayId,
    consensusThreshold: config.consensusThreshold,
    validators: results.map((r) => ({
      url: r.url,
      ok: r.ok,
      data: r.ok ? r.data : undefined,
      error: r.error,
    })),
  });
});

export default router;
