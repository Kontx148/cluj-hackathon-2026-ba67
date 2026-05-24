import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { ChainTransaction } from '../../api/types';

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function Field({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="tx-detail__field">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function renderCandidates(data: Record<string, unknown>) {
  const raw = data.candidates;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  return (
    <ul className="tx-detail__candidates">
      {raw.map((c, i) => {
        const row = asRecord(c);
        if (!row) return null;
        const photo = typeof row.photoUrl === 'string' ? row.photoUrl : '';
        return (
          <li key={String(row.id ?? i)} className="tx-detail__candidate">
            {photo ? (
              <img
                src={photo}
                alt=""
                className="tx-detail__candidate-photo"
                loading="lazy"
              />
            ) : (
              <div className="tx-detail__candidate-photo tx-detail__candidate-photo--empty" />
            )}
            <div>
              <strong>{String(row.name ?? row.id ?? '—')}</strong>
              <div className="muted small">
                <code>{String(row.id ?? '')}</code>
                {row.subtext ? ` · ${String(row.subtext)}` : ''}
              </div>
              {photo && (
                <div className="tx-detail__photo-url muted small">{photo}</div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Full transaction payload — especially election lifecycle fields.
 */
export function TransactionDetail({ tx }: { tx: ChainTransaction }) {
  const data =
    asRecord(tx.data) ??
    asRecord(tx.payload) ??
    asRecord((tx as Record<string, unknown>).transactionData);

  const electionId =
    tx.electionId ??
    (typeof data?.electionId === 'string' ? data.electionId : undefined);

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
        <dl className="tx-detail__grid">
          <Field label="Transaction hash" value={<code className="hash">{tx.transactionHash}</code>} />
          <Field label="Type" value={tx.type} />
          <Field
            label="Timestamp"
            value={
              tx.timestamp
                ? new Date(tx.timestamp).toLocaleString()
                : undefined
            }
          />
          <Field
            label="Election"
            value={
              electionId ? (
                <Link to={`/elections/${encodeURIComponent(electionId)}`}>
                  {electionId}
                </Link>
              ) : undefined
            }
          />
        </dl>

        {data && (
          <>
            <h4 className="tx-detail__section-title">Transaction data</h4>
            <dl className="tx-detail__grid">
              <Field label="Name" value={data.name as string} />
              <Field label="Type" value={data.type as string} />
              <Field label="Status" value={data.status as string} />
              <Field label="Proposed by" value={data.proposedBy as string} />
              <Field
                label="Proposed at"
                value={
                  data.proposedAt
                    ? new Date(String(data.proposedAt)).toLocaleString()
                    : undefined
                }
              />
              <Field
                label="Required approvals"
                value={
                  data.requiredApprovals !== undefined
                    ? String(data.requiredApprovals)
                    : undefined
                }
              />
              <Field
                label="Starts at"
                value={
                  data.startsAt
                    ? new Date(String(data.startsAt)).toLocaleString()
                    : undefined
                }
              />
              <Field
                label="Ends at"
                value={
                  data.endsAt
                    ? new Date(String(data.endsAt)).toLocaleString()
                    : undefined
                }
              />
              <Field
                label="Districts"
                value={
                  Array.isArray(data.districts)
                    ? (data.districts as string[]).map((d) => (
                        <code key={d} className="chip">
                          {d}
                        </code>
                      ))
                    : undefined
                }
              />
              <Field
                label="Institution"
                value={data.institutionId as string}
              />
              <Field
                label="Candidate"
                value={data.candidateId as string}
              />
              <Field label="District" value={data.districtId as string} />
              <Field
                label="Encrypted vote"
                value={
                  data.encryptedVote ? (
                    <code className="hash small">{String(data.encryptedVote)}</code>
                  ) : undefined
                }
              />
              <Field
                label="Public key"
                value={
                  data.electionPublicKey ? (
                    <code className="hash small">
                      {String(data.electionPublicKey).slice(0, 48)}…
                    </code>
                  ) : undefined
                }
              />
            </dl>

            {renderCandidates(data)}

            {Array.isArray(data.approvals) && data.approvals.length > 0 && (
              <>
                <h4 className="tx-detail__section-title">Approvals</h4>
                <pre className="json-block">
                  <code>{JSON.stringify(data.approvals, null, 2)}</code>
                </pre>
              </>
            )}

            {data.publishedTally != null && (
              <>
                <h4 className="tx-detail__section-title">Published tally</h4>
                <pre className="json-block">
                  <code>{JSON.stringify(data.publishedTally, null, 2)}</code>
                </pre>
              </>
            )}

            <details className="tx-detail__raw">
              <summary className="muted small">Raw JSON</summary>
              <pre className="json-block">
                <code>{JSON.stringify(data, null, 2)}</code>
              </pre>
            </details>
          </>
        )}

        {!data && (
          <pre className="json-block">
            <code>{JSON.stringify(tx, null, 2)}</code>
          </pre>
        )}
      </div>
    </details>
  );
}
