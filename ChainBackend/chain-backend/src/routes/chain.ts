import { Router } from 'express';
import { storage } from '../storage';
import { verifyChain } from '../verify';

const router = Router();

router.get('/', (_req, res) => {
  const blocks = storage.state.blocks;
  res.json({
    blockCount: blocks.length,
    head: blocks.length ? blocks[blocks.length - 1].blockHash : null,
    blocks,
  });
});

router.get('/blocks', (_req, res) => {
  res.json({ blocks: storage.state.blocks });
});

router.get('/blocks/:blockNumber', (req, res) => {
  const n = Number(req.params.blockNumber);
  if (!Number.isInteger(n)) {
    return res.status(400).json({ error: 'blockNumber must be an integer' });
  }
  const b = storage.state.blocks.find((x) => x.blockNumber === n);
  if (!b) return res.status(404).json({ error: 'Block not found' });
  res.json(b);
});

router.get('/transactions/:transactionHash', (req, res) => {
  const hash = req.params.transactionHash;
  for (const b of storage.state.blocks) {
    const tx = b.transactions.find((t) => t.transactionHash === hash);
    if (tx) {
      return res.json({
        block: { blockNumber: b.blockNumber, blockHash: b.blockHash },
        transaction: tx,
      });
    }
  }
  res.status(404).json({ error: 'Transaction not found' });
});

router.get('/elections/:electionId', (req, res) => {
  const id = req.params.electionId;
  const election = storage.state.elections[id] || null;
  const blocks = storage.state.blocks.filter((b) =>
    b.transactions.some((t) => t.electionId === id),
  );
  const transactions = blocks.flatMap((b) =>
    b.transactions
      .filter((t) => t.electionId === id)
      .map((t) => ({ ...t, blockNumber: b.blockNumber })),
  );
  res.json({ election, blocks, transactions });
});

router.get('/elections/:electionId/blocks', (req, res) => {
  const id = req.params.electionId;
  const blocks = storage.state.blocks.filter((b) =>
    b.transactions.some((t) => t.electionId === id),
  );
  res.json({ blocks });
});

router.get('/elections/:electionId/transactions', (req, res) => {
  const id = req.params.electionId;
  const transactions = storage.state.blocks.flatMap((b) =>
    b.transactions
      .filter((t) => t.electionId === id)
      .map((t) => ({ ...t, blockNumber: b.blockNumber })),
  );
  res.json({ transactions });
});

router.get('/verify', (_req, res) => {
  res.json(verifyChain());
});

export default router;
