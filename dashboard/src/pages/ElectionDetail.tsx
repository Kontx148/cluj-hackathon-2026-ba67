import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { computeVoteCounts, listBlocks } from '../api/chain';
import { getElection } from '../api/elections';
import {
  normalisePerDistrict,
  type ApprovalRecord,
  type PublishedTally,
} from '../api/types';
import { ActionPanel } from '../components/ActionPanel/ActionPanel';
import { StatusBadge } from '../components/StatusBadge/StatusBadge';
import { ELECTION_DETAIL_POLL_MS } from '../constants';

function formatDateTime(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

const APPROVING_INSTITUTIONS = ['AEP', 'BEC', 'COURT'] as const;

function ApprovalTracker({
  approvals,
}: {
  approvals: ApprovalRecord[] | undefined;
}) {
  const approved = new Set(
    (approvals ?? []).map((a) => a.institutionId?.toUpperCase()),
  );
  return (
    <ul className="approval-tracker">
      {APPROVING_INSTITUTIONS.map((id) => {
        const yes = approved.has(id);
        return (
          <li
            key={id}
            className={`approval-tracker__item ${
              yes ? 'approval-tracker__item--yes' : ''
            }`}
          >
            <span className="approval-tracker__mark" aria-hidden="true">
              {yes ? '✓' : '○'}
            </span>
            <span>{id}</span>
          </li>
        );
      })}
    </ul>
  );
}

function TallyBars({ tally }: { tally: PublishedTally }) {
  const total = tally.totalVotes || tally.perCandidate.reduce((s, c) => s + c.votes, 0);
  return (
    <div className="tally">
      <div className="tally__total">
        Total votes:{' '}
        <strong>{(total ?? 0).toLocaleString()}</strong>
      </div>
      <ul className="tally__list">
        {tally.perCandidate.map((c) => {
          const pct = total ? (c.votes / total) * 100 : 0;
          return (
            <li key={c.candidateId} className="tally__item">
              <div className="tally__item-row">
                <strong>{c.name ?? c.candidateId}</strong>
                <span className="muted small">
                  {c.votes.toLocaleString()} ({pct.toFixed(1)}%)
                </span>
              </div>
              <div
                className="tally__bar"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
              >
                <div
                  className="tally__bar-fill"
                  style={{ width: `${pct.toFixed(2)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ElectionDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showPerDistrict, setShowPerDistrict] = useState(false);

  const query = useQuery({
    queryKey: ['election', id],
    queryFn: () => getElection(id),
    refetchInterval: ELECTION_DETAIL_POLL_MS,
    enabled: !!id,
  });

  const blocksQuery = useQuery({
    queryKey: ['chain', 'blocks'],
    queryFn: listBlocks,
    refetchInterval: ELECTION_DETAIL_POLL_MS,
    enabled: !!id,
  });
  const voteCount = useMemo(
    () => computeVoteCounts(blocksQuery.data).get(id) ?? null,
    [blocksQuery.data, id],
  );

  if (query.isLoading) {
    return (
      <div className="detail">
        <div className="page-breadcrumb">
          <Link to="/">← Back to elections</Link>
        </div>
        <p className="muted">Loading election…</p>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="detail">
        <div className="page-breadcrumb">
          <Link to="/">← Back to elections</Link>
        </div>
        <div className="banner banner--error">
          Could not load election <code>{id}</code>:{' '}
          {query.error instanceof Error
            ? query.error.message
            : 'unknown error'}
        </div>
      </div>
    );
  }

  const election = query.data;
  const tally = election.publishedTally ?? election.tally;
  const showApprovals =
    election.status === 'PROPOSED' || election.status === 'APPROVED';
  const districts = election.districts ?? [];
  const candidates = election.candidates ?? [];

  return (
    <div className="detail">
      <div className="page-breadcrumb">
        <Link to="/">← Back to elections</Link>
      </div>

      <header className="detail__header card">
        <div className="detail__header-main">
          <div className="detail__header-titles">
            <h1>{election.name}</h1>
            <code className="muted">{election.electionId}</code>
          </div>
          <div className="detail__header-meta">
            <StatusBadge status={election.status} />
            <span className="pill pill--grey">{election.type}</span>
            {(() => {
              const showVotes = [
                'OPEN',
                'FROZEN',
                'TALLYING',
                'DECRYPTED',
                'FINISHED',
              ].includes(election.status);
              if (!showVotes) return null;
              const n =
                voteCount !== null
                  ? voteCount
                  : typeof election.totalVotes === 'number'
                    ? election.totalVotes
                    : null;
              if (n === null) return null;
              return (
                <span className="pill pill--blue">
                  {n.toLocaleString()} vote{n === 1 ? '' : 's'}
                </span>
              );
            })()}
          </div>
        </div>

        <dl className="detail__facts">
          <div>
            <dt>Starts at</dt>
            <dd>{formatDateTime(election.startsAt)}</dd>
          </div>
          <div>
            <dt>Ends at</dt>
            <dd>{formatDateTime(election.endsAt)}</dd>
          </div>
          <div>
            <dt>Districts</dt>
            <dd>
              {districts.length
                ? districts.map((d) => (
                    <code key={d} className="chip">
                      {d}
                    </code>
                  ))
                : '—'}
            </dd>
          </div>
          <div>
            <dt>Required approvals</dt>
            <dd>{election.requiredApprovals}</dd>
          </div>
        </dl>

        <div className="detail__chain-link">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() =>
              navigate(
                `/chain?electionId=${encodeURIComponent(election.electionId)}`,
              )
            }
          >
            View on chain
          </button>
        </div>
      </header>

      <section className="card">
        <h2>Candidates</h2>
        {candidates.length === 0 ? (
          <p className="muted">No candidates registered.</p>
        ) : (
          <ul className="candidate-summary">
            {candidates.map((c) => (
              <li key={c.id} className="candidate-summary__item">
                {c.photoUrl ? (
                  <img
                    src={c.photoUrl}
                    alt=""
                    className="candidate-summary__photo"
                  />
                ) : (
                  <div className="candidate-summary__photo candidate-summary__photo--empty" />
                )}
                <div>
                  <strong>{c.name}</strong>
                  <div className="muted small">
                    <code>{c.id}</code>
                    {c.subtext ? ` · ${c.subtext}` : ''}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showApprovals && (
        <section className="card">
          <h2>Approvals</h2>
          <p className="muted small">
            Need at least <strong>{election.requiredApprovals}</strong> distinct
            institutional approvals to transition to <code>APPROVED</code>.
          </p>
          <ApprovalTracker approvals={election.approvals} />
        </section>
      )}

      <ActionPanel election={election} />

      {election.status === 'FINISHED' && tally && (
        <section className="card">
          <h2>Published tally</h2>
          <TallyBars tally={tally} />

          {(() => {
            const perDistrict = normalisePerDistrict(tally.perDistrict);
            if (perDistrict.length === 0) return null;
            return (
              <details
                open={showPerDistrict}
                onToggle={(e) =>
                  setShowPerDistrict((e.target as HTMLDetailsElement).open)
                }
                className="tally__per-district"
              >
                <summary>Per-district breakdown</summary>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>District</th>
                      <th className="numeric">Total</th>
                      {candidates.map((c) => (
                        <th key={c.id} className="numeric">
                          {c.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {perDistrict.map((d) => {
                      const lookup = new Map(
                        d.perCandidate.map((p) => [p.candidateId, p.votes]),
                      );
                      return (
                        <tr key={d.districtId}>
                          <td>
                            <code>{d.districtId}</code>
                          </td>
                          <td className="numeric">
                            {d.totalVotes.toLocaleString()}
                          </td>
                          {candidates.map((c) => (
                            <td key={c.id} className="numeric">
                              {(lookup.get(c.id) ?? 0).toLocaleString()}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </details>
            );
          })()}
        </section>
      )}
    </div>
  );
}
