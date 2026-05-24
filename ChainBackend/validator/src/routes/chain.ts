import { Router } from 'express';
import { storage } from '../storage';
import { verifyChain } from '../verify';
import { publicTransactionView } from '../public-view';

const router = Router();

function statusMap(): Record<string, string> {
  const m: Record<string, string> = {};
  for (const [id, e] of Object.entries(storage.state.elections)) m[id] = e.status;
  return m;
}

router.get('/', (_req, res) => {
  const blocks = storage.state.blocks;
  const map = statusMap();
  res.json({
    blockCount: blocks.length,
    head: blocks.length ? blocks[blocks.length - 1].blockHash : null,
    blocks: blocks.map((b) => ({
      ...b,
      transactions: b.transactions.map((t) => publicTransactionView(t, map)),
    })),
  });
});

router.get('/blocks', (_req, res) => {
  const map = statusMap();
  res.json({
    blocks: storage.state.blocks.map((b) => ({
      ...b,
      transactions: b.transactions.map((t) => publicTransactionView(t, map)),
    })),
  });
});

// More specific route first so `/blocks/by-hash/<hash>` is not consumed by
// the `/blocks/:blockNumber` matcher.
router.get('/blocks/by-hash/:blockHash', (req, res) => {
  const hash = req.params.blockHash;
  if (!hash || typeof hash !== 'string') {
    return res.status(400).json({ error: 'blockHash is required' });
  }
  const b = storage.state.blocks.find((x) => x.blockHash === hash);
  if (!b) return res.status(404).json({ error: 'Block not found' });
  res.json(b);
});

router.get('/blocks/:blockNumber', (req, res) => {
  const n = Number(req.params.blockNumber);
  if (!Number.isInteger(n)) {
    return res.status(400).json({ error: 'blockNumber must be an integer' });
  }
  const b = storage.state.blocks.find((x) => x.blockNumber === n);
  if (!b) return res.status(404).json({ error: 'Block not found' });
  const map = statusMap();
  res.json({
    ...b,
    transactions: b.transactions.map((t) => publicTransactionView(t, map)),
  });
});

router.get('/blocks/by-hash/:blockHash', (req, res) => {
  const hash = req.params.blockHash;
  const b = storage.state.blocks.find((x) => x.blockHash === hash);
  if (!b) return res.status(404).json({ error: 'Block not found' });
  const map = statusMap();
  res.json({
    ...b,
    transactions: b.transactions.map((t) => publicTransactionView(t, map)),
  });
});

router.get('/transactions/:transactionHash', (req, res) => {
  const hash = req.params.transactionHash;
  const map = statusMap();
  for (const b of storage.state.blocks) {
    const tx = b.transactions.find((t) => t.transactionHash === hash);
    if (tx) {
      return res.json({
        block: { blockNumber: b.blockNumber, blockHash: b.blockHash },
        transaction: publicTransactionView(tx, map),
      });
    }
  }
  res.status(404).json({ error: 'Transaction not found' });
});

router.get('/elections/:electionId', (req, res) => {
  const id = req.params.electionId;
  const map = statusMap();
  const blocks = storage.state.blocks
    .filter((b) => b.transactions.some((t) => t.electionId === id))
    .map((b) => ({
      ...b,
      transactions: b.transactions
        .filter((t) => t.electionId === id)
        .map((t) => publicTransactionView(t, map)),
    }));
  res.json({ blocks });
});

router.get('/elections/:electionId/transactions', (req, res) => {
  const id = req.params.electionId;
  const map = statusMap();
  const transactions = storage.state.blocks.flatMap((b) =>
    b.transactions
      .filter((t) => t.electionId === id)
      .map((t) => ({ ...publicTransactionView(t, map), blockNumber: b.blockNumber })),
  );
  res.json({ transactions });
});

router.get('/verify', (_req, res) => {
  res.json(verifyChain());
});

export default router;
