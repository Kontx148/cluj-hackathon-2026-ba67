import { Router } from 'express';
import { readMajority } from '../chain-aggregate';

const router = Router();

/**
 * Read endpoints simply forward to validators and return the
 * majority-agreed result, with consistency metadata so that clients can
 * tell when validators disagree.
 */

router.get('/', async (_req, res) => {
  const view = await readMajority<unknown>('/chain');
  if (!view.result) return res.status(502).json(view);
  res.json(merge(view));
});

router.get('/blocks', async (_req, res) => {
  const view = await readMajority<unknown>('/chain/blocks');
  if (!view.result) return res.status(502).json(view);
  res.json(merge(view));
});

router.get('/blocks/:blockNumber', async (req, res) => {
  const view = await readMajority<unknown>(
    `/chain/blocks/${encodeURIComponent(req.params.blockNumber)}`,
  );
  if (!view.result) return res.status(404).json(view);
  res.json(merge(view));
});

router.get('/transactions/:transactionHash', async (req, res) => {
  const view = await readMajority<unknown>(
    `/chain/transactions/${encodeURIComponent(req.params.transactionHash)}`,
  );
  if (!view.result) return res.status(404).json(view);
  res.json(merge(view));
});

router.get('/elections/:electionId', async (req, res) => {
  const view = await readMajority<unknown>(
    `/chain/elections/${encodeURIComponent(req.params.electionId)}`,
  );
  if (!view.result) return res.status(404).json(view);
  res.json(merge(view));
});

router.get('/elections/:electionId/transactions', async (req, res) => {
  const view = await readMajority<unknown>(
    `/chain/elections/${encodeURIComponent(req.params.electionId)}/transactions`,
  );
  if (!view.result) return res.status(404).json(view);
  res.json(merge(view));
});

/**
 * GET /chain/verify
 *
 * Aggregates each validator's local /chain/verify report. Returns:
 *   - perValidator: each validator's report
 *   - heads: map of validatorId -> head blockHash
 *   - allValid, allHeadsMatch (booleans)
 */
router.get('/verify', async (_req, res) => {
  const view = await readMajority<{
    valid: boolean;
    issues: string[];
    blockCount: number;
    consensusThreshold: number;
    head: string | null;
  }>('/chain/verify');

  const perValidator = view.views.map((v) => ({
    validatorId: v.validatorId,
    url: v.url,
    ok: !!v.data,
    valid: v.data ? v.data.valid : false,
    issues: v.data?.issues ?? [],
    blockCount: v.data?.blockCount ?? null,
    head: v.data?.head ?? null,
    error: v.error,
  }));

  const heads = new Set(perValidator.filter((p) => p.ok).map((p) => p.head));
  const allValid = perValidator.every((p) => p.ok && p.valid);
  const allHeadsMatch = heads.size === 1 && perValidator.every((p) => p.ok);

  res.json({
    consistent: view.consistent,
    warning: view.warning,
    allValid,
    allHeadsMatch,
    perValidator,
  });
});

function merge<T>(view: {
  result?: T;
  consistent: boolean;
  warning?: string;
  responsiveValidators: number;
  totalValidators: number;
}) {
  return {
    ...(typeof view.result === 'object' && view.result !== null ? view.result : { result: view.result }),
    consistent: view.consistent,
    warning: view.warning,
    responsiveValidators: view.responsiveValidators,
    totalValidators: view.totalValidators,
  };
}

export default router;
