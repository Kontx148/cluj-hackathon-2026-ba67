import express, { type NextFunction, type Request, type Response } from 'express';
import { ensureGenesis } from './chain';
import { config } from './config';
import chainRoutes from './routes/chain';
import consensusRoutes from './routes/consensus';
import electionRoutes from './routes/elections';
import healthRoutes from './routes/health';
import thresholdRoutes from './routes/threshold';
import { replayState } from './state';
import { storage } from './storage';
import { eligibilityService } from './eligibility-service';

function buildApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.use(healthRoutes);
  app.use('/elections', electionRoutes);
  app.use('/chain', chainRoutes);
  app.use('/consensus', consensusRoutes);
  app.use('/threshold-decryption', thresholdRoutes);

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next();
    res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(`[${config.validatorId}] error`, err);
    res.status(err?.status || 500).json({ error: err?.message || 'Internal error' });
  });

  return app;
}

function main() {
  eligibilityService.load();
  storage.load();
  ensureGenesis();
  replayState(storage.state);

  const app = buildApp();
  app.listen(config.port, () => {
    console.log(
      `[${config.validatorId}] listening on :${config.port}; chain=${config.chainStoragePath}; threshold=${config.consensusThreshold}`,
    );
  });
}

main();
