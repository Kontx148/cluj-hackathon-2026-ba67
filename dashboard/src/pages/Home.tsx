import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { computeVoteCounts, listBlocks } from '../api/chain';
import { listElections, normaliseElectionList } from '../api/elections';
import { useCurrentCredentials } from '../components/CredentialBar/CredentialBar';
import { ElectionRow } from '../components/ElectionCard/ElectionCard';
import { toast } from '../components/Toast/toastStore';
import { ValidatorStatusPanel } from '../components/ValidatorStatus/ValidatorStatus';
import { ELECTIONS_POLL_MS } from '../constants';

export function HomePage() {
  const { institutionId } = useCurrentCredentials();
  const canPropose = institutionId === 'AEP' || institutionId === 'Admin';

  const query = useQuery({
    queryKey: ['elections'],
    queryFn: listElections,
    refetchInterval: ELECTIONS_POLL_MS,
    refetchIntervalInBackground: false,
  });

  // Vote counts are derived client-side from the chain because the gateway
  // has no dedicated endpoint yet. Shares its query cache key with the
  // chain explorer so the chain is only fetched once.
  const blocksQuery = useQuery({
    queryKey: ['chain', 'blocks'],
    queryFn: listBlocks,
    refetchInterval: ELECTIONS_POLL_MS,
    refetchIntervalInBackground: false,
  });
  const voteCounts = useMemo(
    () => computeVoteCounts(blocksQuery.data),
    [blocksQuery.data],
  );

  if (query.isError && query.error instanceof Error) {
    toast.error('Failed to load elections', query.error.message);
  }

  const elections = normaliseElectionList(query.data);

  return (
    <div className="home">
      <main className="home__main">
        <header className="page-header">
          <div>
            <h1>Elections</h1>
            <p className="muted">
              {query.isLoading
                ? 'Loading…'
                : `${elections.length} election${elections.length === 1 ? '' : 's'} on record`}
            </p>
          </div>
          <div className="page-header__actions">
            {canPropose ? (
              <Link to="/elections/new" className="btn btn--primary">
                Propose new election
              </Link>
            ) : (
              <button
                type="button"
                className="btn btn--primary"
                disabled
                title="Only AEP or Admin can propose elections"
              >
                Propose new election
              </button>
            )}
            <Link to="/chain" className="btn btn--ghost">
              Chain explorer
            </Link>
          </div>
        </header>

        {query.isError && (
          <div className="banner banner--error">
            Failed to fetch elections:{' '}
            {query.error instanceof Error ? query.error.message : 'unknown error'}
          </div>
        )}

        {!query.isLoading && elections.length === 0 && !query.isError && (
          <div className="empty-state">
            <h3>No elections yet</h3>
            <p className="muted">
              {canPropose
                ? 'Use “Propose new election” above to create the first one.'
                : 'Sign in as AEP or Admin to propose the first election.'}
            </p>
          </div>
        )}

        {elections.length > 0 && (
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Election ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th className="numeric">Votes</th>
                  <th aria-label="actions" />
                </tr>
              </thead>
              <tbody>
                {elections.map((e) => (
                  <ElectionRow
                    key={e.electionId}
                    election={e}
                    voteCount={voteCounts.get(e.electionId)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <ValidatorStatusPanel />
    </div>
  );
}
