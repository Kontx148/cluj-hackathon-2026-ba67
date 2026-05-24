import { Fragment, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ChainBlock, ChainTransaction } from '../../api/types';

const PAGE_SIZE_OPTIONS = [5, 10] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

interface Props {
  /** All blocks, in any order — this component sorts and paginates. */
  blocks: ChainBlock[];
  /**
   * When set, transactions whose hash is in this set are visually
   * highlighted. The block list itself is unchanged — callers can pre-filter
   * `blocks` if they want hard scoping.
   */
  highlightTxHashes?: Set<string>;
}

function truncateHash(hash: string | undefined, head = 10, tail = 8): string {
  if (!hash) return '—';
  if (hash.length <= head + tail + 1) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

function formatTimestamp(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function txElectionId(tx: ChainTransaction): string | undefined {
  return typeof tx.electionId === 'string' ? tx.electionId : undefined;
}

/**
 * Straight vertical arrow linking two stacked block cards. The line is
 * broken in the middle by three vertical dots to suggest "continues here".
 */
function ChainArrow() {
  return (
    <div className="block-arrow" aria-hidden="true">
      <svg viewBox="0 0 24 168" width="24" height="168">
        <defs>
          <marker
            id="bf-arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="5"
            refY="5"
            orient="auto"
          >
            <polygon points="0,0 10,5 0,10" fill="currentColor" />
          </marker>
        </defs>
        <line
          x1="12"
          y1="2"
          x2="12"
          y2="52"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {[62, 72, 82, 92, 102].map((cy) => (
          <circle key={cy} cx="12" cy={cy} r="2" fill="currentColor" />
        ))}
        <line
          x1="12"
          y1="112"
          x2="12"
          y2="162"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          markerEnd="url(#bf-arrowhead)"
        />
      </svg>
    </div>
  );
}

function TransactionRow({
  tx,
  highlighted,
}: {
  tx: ChainTransaction;
  highlighted: boolean;
}) {
  const eid = txElectionId(tx);
  return (
    <li
      className={`block-card__tx ${
        highlighted ? 'block-card__tx--highlight' : ''
      }`}
    >
      <span className="block-card__tx-type">{tx.type}</span>
      {eid && (
        <Link
          to={`/elections/${encodeURIComponent(eid)}`}
          className="block-card__tx-election"
          title={`Open election ${eid}`}
        >
          {eid}
        </Link>
      )}
      <code className="block-card__tx-hash hash">
        {truncateHash(tx.transactionHash, 8, 6)}
      </code>
    </li>
  );
}

function BlockCard({
  block,
  highlightTxHashes,
}: {
  block: ChainBlock;
  highlightTxHashes?: Set<string>;
}) {
  const sigs = block.validatorSignatures ?? [];
  const txs = block.transactions ?? [];
  return (
    <article className="block-card">
      <header className="block-card__header">
        <div className="block-card__num">
          <span className="block-card__num-label">block</span>
          <span className="block-card__num-value">
            #{block.blockNumber}
          </span>
        </div>
        <time className="block-card__time muted small">
          {formatTimestamp(block.timestamp)}
        </time>
      </header>

      <dl className="block-card__hashes">
        <div>
          <dt>block hash</dt>
          <dd>
            {block.blockHash ? (
              <Link
                to={`/chain?hash=${encodeURIComponent(block.blockHash)}`}
                className="block-card__hash-link"
                title={`Open block ${block.blockHash} in the block browser`}
              >
                <code className="hash">
                  {truncateHash(block.blockHash, 14, 10)}
                </code>
              </Link>
            ) : (
              <code className="hash">—</code>
            )}
          </dd>
        </div>
        <div>
          <dt>previous</dt>
          <dd>
            {block.previousHash &&
            block.previousHash !==
              '0000000000000000000000000000000000000000000000000000000000000000' ? (
              <Link
                to={`/chain?hash=${encodeURIComponent(block.previousHash)}`}
                className="block-card__hash-link muted"
                title={`Open block ${block.previousHash}`}
              >
                <code className="hash">
                  {truncateHash(block.previousHash, 14, 10)}
                </code>
              </Link>
            ) : (
              <code className="hash muted" title={block.previousHash}>
                {truncateHash(block.previousHash, 14, 10)}
              </code>
            )}
          </dd>
        </div>
      </dl>

      <div className="block-card__sigs">
        <span className="block-card__sigs-count">
          {sigs.length} signature{sigs.length === 1 ? '' : 's'}
        </span>
        <ul className="block-card__sigs-list">
          {sigs.map((s) => (
            <li key={s.validatorId} title={s.signature}>
              {s.validatorId}
            </li>
          ))}
        </ul>
      </div>

      <div className="block-card__txs">
        <div className="block-card__txs-header">
          <span>transactions</span>
          <span className="muted small">{txs.length}</span>
        </div>
        {txs.length === 0 ? (
          <div className="muted small block-card__txs-empty">
            Genesis / empty block
          </div>
        ) : (
          <ul className="block-card__tx-list">
            {txs.map((tx, i) => (
              <TransactionRow
                key={tx.transactionHash ?? `${block.blockNumber}-${i}`}
                tx={tx}
                highlighted={
                  !!highlightTxHashes &&
                  !!tx.transactionHash &&
                  highlightTxHashes.has(tx.transactionHash)
                }
              />
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export function BlockFlow({ blocks, highlightTxHashes }: Props) {
  const [pageSize, setPageSize] = useState<PageSize>(5);
  const [pageStart, setPageStart] = useState(0);

  // Newest first.
  const sorted = useMemo(
    () => [...blocks].sort((a, b) => b.blockNumber - a.blockNumber),
    [blocks],
  );
  const total = sorted.length;
  const safeStart = Math.min(pageStart, Math.max(0, total - pageSize));
  const page = sorted.slice(safeStart, safeStart + pageSize);

  const hasNewer = safeStart > 0;
  const hasOlder = safeStart + pageSize < total;

  if (total === 0) {
    return (
      <div className="empty-state">
        <h3>No blocks to display</h3>
        <p className="muted">
          The chain is empty, or the gateway returned no blocks.
        </p>
      </div>
    );
  }

  const firstNum = page[0]?.blockNumber;
  const lastNum = page[page.length - 1]?.blockNumber;

  return (
    <div className="block-flow">
      <header className="block-flow__toolbar">
        <div className="muted small">
          Showing blocks{' '}
          <strong>
            #{firstNum} – #{lastNum}
          </strong>{' '}
          of <strong>{total}</strong>
        </div>
        <div className="block-flow__toolbar-actions">
          <label className="block-flow__page-size">
            <span className="muted small">per page</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value) as PageSize);
                setPageStart(0);
              }}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <div className="block-flow__pager">
            <button
              type="button"
              className="btn btn--ghost btn--small"
              disabled={!hasNewer}
              onClick={() =>
                setPageStart((s) => Math.max(0, s - pageSize))
              }
            >
              ← Newer
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--small"
              disabled={!hasOlder}
              onClick={() =>
                setPageStart((s) => Math.min(total - pageSize, s + pageSize))
              }
            >
              Older →
            </button>
          </div>
        </div>
      </header>

      <div className="block-flow__list">
        {page.map((block, i) => (
          <Fragment key={block.blockHash ?? block.blockNumber}>
            <BlockCard block={block} highlightTxHashes={highlightTxHashes} />
            {i < page.length - 1 && <ChainArrow />}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
