import { Link } from 'react-router-dom';
import type { Election } from '../../api/types';
import { StatusBadge } from '../StatusBadge/StatusBadge';

interface Props {
  election: Election;
  /**
   * Vote count derived client-side from the chain (`VOTE_CAST` transactions).
   * Preferred over `election.totalVotes` because the elections endpoint
   * doesn't expose totals on this gateway.
   */
  voteCount?: number;
}

export function ElectionRow({ election, voteCount }: Props) {
  const count =
    typeof voteCount === 'number'
      ? voteCount
      : typeof election.totalVotes === 'number'
        ? election.totalVotes
        : null;
  return (
    <tr>
      <td>
        <Link to={`/elections/${encodeURIComponent(election.electionId)}`}>
          <code>{election.electionId}</code>
        </Link>
      </td>
      <td>{election.name}</td>
      <td className="muted">{election.type}</td>
      <td>
        <StatusBadge status={election.status} />
      </td>
      <td className="numeric">
        {count !== null ? count.toLocaleString() : '—'}
      </td>
      <td>
        <Link
          to={`/elections/${encodeURIComponent(election.electionId)}`}
          className="btn btn--ghost btn--small"
        >
          Open
        </Link>
      </td>
    </tr>
  );
}
