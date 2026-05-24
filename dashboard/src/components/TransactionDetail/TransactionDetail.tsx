import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getElection } from '../../api/elections';
import type { ChainTransaction } from '../../api/types';
import { resolveVoteChoiceWithElection } from '../../utils/voteDisplay';

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

/**
 * Block explorer transaction row — summary + raw JSON only.
 */
export function TransactionDetail({ tx }: { tx: ChainTransaction }) {
  const data =
    asRecord(tx.data) ??
    asRecord(tx.payload) ??
    asRecord((tx as Record<string, unknown>).transactionData);

  const electionId =
    tx.electionId ??
    (typeof data?.electionId === 'string' ? data.electionId : undefined);

  const isVote = tx.type === 'VOTE_CAST';

  const electionQuery = useQuery({
    queryKey: ['election', electionId],
    queryFn: () => getElection(electionId!),
    enabled: isVote && !!electionId,
    staleTime: 60_000,
  });

  const voteChoice =
    isVote && data
      ? resolveVoteChoiceWithElection(
          data,
          electionId,
          electionQuery.data?.candidates ?? [],
        )
      : null;

  const rawPayload = data ?? tx;

  return (
    <details className="tx-detail" open={isVote ? undefined : false}>
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
        {voteChoice && (
          <span className="tx-detail__vote-choice">{voteChoice.summary}</span>
        )}
        <code className="tx-detail__hash hash">{tx.transactionHash}</code>
      </summary>

      <div className="tx-detail__body">
        <pre className="json-block">
          <code>{JSON.stringify(rawPayload, null, 2)}</code>
        </pre>
      </div>
    </details>
  );
}
