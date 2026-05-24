import { Link } from 'react-router-dom';
import type { ChainTransaction } from '../../api/types';

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

/**
 * Block explorer transaction row.
 * VOTE_CAST: only encryptedVote + encryptedDigitalId, always visible (no summary).
 * Other types: collapsible summary + full data JSON.
 */
export function TransactionDetail({ tx }: { tx: ChainTransaction }) {
  const data =
    asRecord(tx.data) ??
    asRecord(tx.payload) ??
    asRecord((tx as Record<string, unknown>).transactionData);

  const electionId =
    tx.electionId ??
    (typeof data?.electionId === 'string' ? data.electionId : undefined);

  if (tx.type === 'VOTE_CAST' && data) {
    const encryptedOnly = {
      ...(data.encryptedVote !== undefined
        ? { encryptedVote: data.encryptedVote }
        : {}),
      ...(data.encryptedDigitalId !== undefined
        ? { encryptedDigitalId: data.encryptedDigitalId }
        : {}),
    };

    return (
      <div className="tx-detail tx-detail--vote-plain">
        <pre className="json-block">
          <code>{JSON.stringify(encryptedOnly, null, 2)}</code>
        </pre>
      </div>
    );
  }

  const displayPayload = data ?? tx;

  return (
    <details className="tx-detail">
      <summary className="tx-detail__summary">
        <span className="tx-detail__type">{tx.type}</span>
        {electionId && (
          <Link
            to={`/elections/${encodeURIComponent(electionId)}`}
            className="tx-detail__election-link"
            onClick={(e) => e.stopPropagation()}
          >
            {electionId}
          </Link>
        )}
        <code className="tx-detail__hash hash">{tx.transactionHash}</code>
      </summary>

      <div className="tx-detail__body">
        <pre className="json-block">
          <code>{JSON.stringify(displayPayload, null, 2)}</code>
        </pre>
      </div>
    </details>
  );
}
