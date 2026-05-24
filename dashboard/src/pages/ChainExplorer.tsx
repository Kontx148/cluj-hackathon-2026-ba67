import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  getBlock,
  getBlockByHash,
  listBlocks,
  listElectionTransactions,
  verifyChain,
} from '../api/chain';
import type { ChainBlock } from '../api/types';
import { shortValidatorId, toPublicValidatorUrl } from '../api/urls';
import { BlockFlow } from '../components/BlockFlow/BlockFlow';
import { TransactionDetail } from '../components/TransactionDetail/TransactionDetail';
import { toast } from '../components/Toast/toastStore';

type Tab = 'block' | 'tx' | 'verify';

type BlockLookup =
  | { kind: 'number'; value: number }
  | { kind: 'hash'; value: string };

function fetchBlock(lookup: BlockLookup): Promise<ChainBlock> {
  return lookup.kind === 'number'
    ? getBlock(lookup.value)
    : getBlockByHash(lookup.value);
}

function BlockBrowser({ initialHash }: { initialHash?: string }) {
  const [numberInput, setNumberInput] = useState('0');
  const [hashInput, setHashInput] = useState(initialHash ?? '');
  const [lookup, setLookup] = useState<BlockLookup | null>(
    initialHash ? { kind: 'hash', value: initialHash } : null,
  );

  // If the URL gets a new ?hash= while the page is open, auto-submit it.
  useEffect(() => {
    if (initialHash) {
      setHashInput(initialHash);
      setLookup({ kind: 'hash', value: initialHash });
    }
  }, [initialHash]);

  const query = useQuery<ChainBlock>({
    queryKey: ['chain', 'block', lookup],
    queryFn: () => fetchBlock(lookup as BlockLookup),
    enabled: lookup !== null,
  });

  function submitNumber(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(numberInput);
    if (!Number.isInteger(n) || n < 0) {
      toast.error('Invalid block number');
      return;
    }
    setLookup({ kind: 'number', value: n });
  }

  function submitHash(e: React.FormEvent) {
    e.preventDefault();
    const h = hashInput.trim();
    if (!h) {
      toast.error('Enter a block hash');
      return;
    }
    setLookup({ kind: 'hash', value: h });
  }

  const isFetchingNumber =
    query.isFetching && lookup?.kind === 'number';
  const isFetchingHash = query.isFetching && lookup?.kind === 'hash';

  return (
    <div className="explorer-section">
      <form className="explorer-form" onSubmit={submitNumber}>
        <label className="form__field">
          <span>By block number</span>
          <input
            type="number"
            min={0}
            value={numberInput}
            onChange={(e) => setNumberInput(e.target.value)}
            placeholder="0"
          />
        </label>
        <button type="submit" className="btn btn--primary">
          {isFetchingNumber ? <span className="spinner" /> : 'Fetch'}
        </button>
      </form>

      <form className="explorer-form" onSubmit={submitHash}>
        <label className="form__field form__field--wide">
          <span>By block hash</span>
          <input
            type="text"
            value={hashInput}
            onChange={(e) => setHashInput(e.target.value)}
            placeholder="e.g. 9ecd9b99df7784504744faf5fe65bfc27c031508…"
            spellCheck={false}
          />
        </label>
        <button type="submit" className="btn btn--primary">
          {isFetchingHash ? <span className="spinner" /> : 'Fetch'}
        </button>
      </form>

      {query.isError && (
        <div className="banner banner--error">
          {query.error instanceof Error ? query.error.message : 'Fetch failed'}
        </div>
      )}

      {query.data && (
        <div className="card explorer-result">
          <header className="explorer-result__header">
            <h3>
              Block #{query.data.blockNumber}{' '}
              <span className="muted small">
                ({query.data.transactions.length} tx,{' '}
                {query.data.validatorSignatures?.length ?? 0} sigs)
              </span>
            </h3>
            <time className="muted small">
              {query.data.timestamp
                ? new Date(query.data.timestamp).toLocaleString()
                : '—'}
            </time>
          </header>

          <dl className="explorer-result__facts">
            <div>
              <dt>Block number</dt>
              <dd>{query.data.blockNumber}</dd>
            </div>
            <div>
              <dt>Timestamp</dt>
              <dd>
                {query.data.timestamp
                  ? new Date(query.data.timestamp).toLocaleString()
                  : '—'}
              </dd>
            </div>
            <div>
              <dt>blockHash</dt>
              <dd>
                <code className="hash">{query.data.blockHash}</code>
              </dd>
            </div>
            <div>
              <dt>previousHash</dt>
              <dd>
                <code className="hash">{query.data.previousHash}</code>
              </dd>
            </div>
            <div>
              <dt>Validator signatures</dt>
              <dd>{query.data.validatorSignatures?.length ?? 0}</dd>
            </div>
          </dl>

          {(query.data.validatorSignatures?.length ?? 0) > 0 && (
            <>
              <h4>Signatures</h4>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Validator</th>
                    <th>Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.validatorSignatures.map((s) => (
                    <tr key={s.validatorId}>
                      <td>
                        <code>{s.validatorId}</code>
                      </td>
                      <td>
                        <code className="hash small">{s.signature}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <h4>Transactions ({query.data.transactions.length})</h4>
          <div className="block-card__tx-list">
            {query.data.transactions.map((tx, i) => (
              <TransactionDetail
                key={tx.transactionHash ?? `tx-${i}`}
                tx={tx}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The "Transaction lookup" tab. Always shows the chain as a visual
 * paginated block flow with S-curved arrows between blocks. An optional
 * election-ID filter scopes the flow to blocks containing transactions for
 * that election, using `GET /chain/elections/:electionId/transactions`.
 */
function TransactionFlowTab({ initialElection }: { initialElection?: string }) {
  const [filterInput, setFilterInput] = useState(initialElection ?? '');
  const [activeFilter, setActiveFilter] = useState<string | null>(
    initialElection ?? null,
  );

  const blocksQuery = useQuery({
    queryKey: ['chain', 'blocks'],
    queryFn: listBlocks,
  });

  const electionTxQuery = useQuery({
    queryKey: ['chain', 'election-tx', activeFilter],
    queryFn: () => listElectionTransactions(activeFilter as string),
    enabled: !!activeFilter,
  });

  // Tx hashes belonging to the filtered election — used both to scope the
  // block list and to highlight rows inside each block card.
  const electionTxHashes = useMemo(() => {
    if (!activeFilter || !electionTxQuery.data) return null;
    return new Set(
      electionTxQuery.data
        .map((tx) => tx.transactionHash)
        .filter((h): h is string => !!h),
    );
  }, [activeFilter, electionTxQuery.data]);

  const visibleBlocks: ChainBlock[] = useMemo(() => {
    const all = blocksQuery.data ?? [];
    if (!electionTxHashes) return all;
    return all.filter((b) =>
      (b.transactions ?? []).some(
        (tx) => tx.transactionHash && electionTxHashes.has(tx.transactionHash),
      ),
    );
  }, [blocksQuery.data, electionTxHashes]);

  const electionTxCount = electionTxQuery.data?.length ?? 0;

  return (
    <div className="explorer-section">
      <form
        className="explorer-form"
        onSubmit={(e) => {
          e.preventDefault();
          const v = filterInput.trim();
          setActiveFilter(v || null);
        }}
      >
        <label className="form__field form__field--wide">
          <span>Filter by election ID (optional)</span>
          <input
            type="text"
            value={filterInput}
            onChange={(e) => setFilterInput(e.target.value)}
            placeholder="e.g. RO-PRESIDENTIAL-2029"
            spellCheck={false}
          />
          <small className="muted">
            Scopes the chain view to blocks containing this election's
            transactions.
          </small>
        </label>
        <div className="explorer-form__actions">
          <button type="submit" className="btn btn--primary">
            {electionTxQuery.isFetching ? (
              <span className="spinner" />
            ) : (
              'Apply'
            )}
          </button>
          {activeFilter && (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setFilterInput('');
                setActiveFilter(null);
              }}
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {electionTxQuery.isError && (
        <div className="banner banner--error">
          {electionTxQuery.error instanceof Error
            ? electionTxQuery.error.message
            : 'Could not load transactions for this election'}
        </div>
      )}

      {activeFilter && electionTxHashes && (
        <div className="banner banner--info-soft">
          Showing <strong>{visibleBlocks.length}</strong> block
          {visibleBlocks.length === 1 ? '' : 's'} containing{' '}
          <strong>{electionTxCount}</strong> transaction
          {electionTxCount === 1 ? '' : 's'} for{' '}
          <code>{activeFilter}</code>. Matching transactions are highlighted
          inside each block.
        </div>
      )}

      {blocksQuery.isError && (
        <div className="banner banner--error">
          {blocksQuery.error instanceof Error
            ? blocksQuery.error.message
            : 'Could not load blocks'}
        </div>
      )}

      {blocksQuery.isLoading ? (
        <div className="muted">Loading chain…</div>
      ) : (
        <BlockFlow
          blocks={visibleBlocks}
          highlightTxHashes={electionTxHashes ?? undefined}
        />
      )}
    </div>
  );
}

function ChainVerify() {
  const mutation = useMutation({
    mutationFn: verifyChain,
    onError: (err: Error) => toast.error('Verify failed', err.message),
    onSuccess: (data) => {
      const ok = data.consistent && data.allValid && data.allHeadsMatch;
      if (ok) toast.success('Chain verified', 'all checks passed');
      else toast.error('Chain verify failed', 'see panel for details');
    },
  });

  const data = mutation.data;

  return (
    <div className="explorer-section">
      <div className="explorer-form">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? <span className="spinner" /> : 'Run verify'}
        </button>
        <p className="muted small">
          Re-runs hash, link and policy checks across every validator.
        </p>
      </div>

      {data && (
        <>
          <div className="verify-summary">
            <div
              className={`verify-card ${
                data.consistent ? 'verify-card--ok' : 'verify-card--bad'
              }`}
            >
              <span className="verify-card__label">Consistent</span>
              <span className="verify-card__value">{String(data.consistent)}</span>
            </div>
            <div
              className={`verify-card ${
                data.allValid ? 'verify-card--ok' : 'verify-card--bad'
              }`}
            >
              <span className="verify-card__label">All valid</span>
              <span className="verify-card__value">{String(data.allValid)}</span>
            </div>
            <div
              className={`verify-card ${
                data.allHeadsMatch ? 'verify-card--ok' : 'verify-card--bad'
              }`}
            >
              <span className="verify-card__label">All heads match</span>
              <span className="verify-card__value">
                {String(data.allHeadsMatch)}
              </span>
            </div>
          </div>

          <div className="card">
            <h3>Per validator</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Validator</th>
                  <th>Valid</th>
                  <th className="numeric">Blocks</th>
                  <th>Head</th>
                </tr>
              </thead>
              <tbody>
                {(data.perValidator ?? []).map((v) => {
                  const shortId = shortValidatorId(v.validatorId);
                  const publicUrl = toPublicValidatorUrl(
                    v.url ?? v.validatorId,
                  );
                  return (
                  <tr key={v.validatorId}>
                    <td>
                      <div>{shortId}</div>
                      {publicUrl && (
                        <a
                          href={`${publicUrl}/health`}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="muted small"
                        >
                          <code>{publicUrl}</code>
                        </a>
                      )}
                    </td>
                    <td>
                      <span
                        className={`pill ${
                          v.valid ? 'pill--green' : 'pill--red'
                        }`}
                      >
                        {String(v.valid)}
                      </span>
                    </td>
                    <td className="numeric">{v.blockCount}</td>
                    <td>
                      <code className="hash">{v.head}</code>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export function ChainExplorerPage() {
  const [searchParams] = useSearchParams();
  const preElection = searchParams.get('electionId') ?? undefined;
  const preHash = searchParams.get('hash') ?? undefined;

  // Priority: a specific block hash deep-links to the block browser.
  // Otherwise an electionId opens the transaction flow scoped to it.
  // Otherwise default to the block browser.
  const [tab, setTab] = useState<Tab>(
    preHash ? 'block' : preElection ? 'tx' : 'block',
  );

  return (
    <div className="explorer">
      <div className="page-breadcrumb">
        <Link to="/">← Back to elections</Link>
      </div>

      <header className="page-header">
        <div>
          <h1>Chain explorer</h1>
          <p className="muted">
            Inspect blocks, look up transactions, and run a full-chain
            integrity verification across all validators.
          </p>
        </div>
      </header>

      <nav className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'block'}
          className={`tab ${tab === 'block' ? 'tab--active' : ''}`}
          onClick={() => setTab('block')}
        >
          Block browser
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'tx'}
          className={`tab ${tab === 'tx' ? 'tab--active' : ''}`}
          onClick={() => setTab('tx')}
        >
          Transaction lookup
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'verify'}
          className={`tab ${tab === 'verify' ? 'tab--active' : ''}`}
          onClick={() => setTab('verify')}
        >
          Integrity verify
        </button>
      </nav>

      <div className="tab-panel" role="tabpanel">
        {tab === 'block' && <BlockBrowser initialHash={preHash} />}
        {tab === 'tx' && <TransactionFlowTab initialElection={preElection} />}
        {tab === 'verify' && <ChainVerify />}
      </div>
    </div>
  );
}
