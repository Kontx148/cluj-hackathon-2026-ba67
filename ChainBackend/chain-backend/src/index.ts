import express, { type NextFunction, type Request, type Response } from 'express';
import { ensureGenesis } from './chain';
import { config } from './config';
import { storage } from './storage';
import chainRoutes from './routes/chain';
import electionRoutes from './routes/elections';
import healthRoutes from './routes/health';
import institutionRoutes from './routes/institutions';
import voteRoutes from './routes/votes';

function buildApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.use(healthRoutes);
  app.use('/institutions', institutionRoutes);
  app.use('/elections', electionRoutes);
  app.use('/votes', voteRoutes);
  app.use('/chain', chainRoutes);

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next();
    res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[error]', err);
    res.status(err?.status || 500).json({ error: err?.message || 'Internal error' });
  });

  return app;
}

function main() {
  storage.load();
  ensureGenesis();

  const app = buildApp();
  app.listen(config.port, () => {
    console.log(`[chain-backend] listening on :${config.port}`);
    console.log(`[chain-backend] validators: ${config.validatorUrls.join(', ')}`);
    console.log(`[chain-backend] consensus threshold: ${config.consensusThreshold}`);
    console.log(`[chain-backend] storage: ${config.chainStorageMode} (${config.chainStoragePath})`);
  });
}

main();
