import { useQuery } from '@tanstack/react-query';
import { GATEWAY_URLS } from '../../api/client';
import { toPublicValidatorUrl } from '../../api/urls';
import { getValidatorStatus } from '../../api/validators';
import { EXPECTED_VALIDATORS, VALIDATORS_POLL_MS } from '../../constants';
import { toast } from '../Toast/toastStore';

function truncateHash(hash: string | undefined, head = 8, tail = 6): string {
  if (!hash) return '—';
  if (hash.length <= head + tail + 1) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

export function ValidatorStatusPanel() {
  const { data, isError, error, isLoading, isFetching } = useQuery({
    queryKey: ['validators', 'status'],
    queryFn: getValidatorStatus,
    refetchInterval: VALIDATORS_POLL_MS,
    refetchIntervalInBackground: false,
    retry: 1,
  });

  // Toast on transition to error, not on every render.
  // Note: this is a lightweight pattern — for a heavier app, prefer a
  // dedicated query-cache-wide error handler.
  if (isError && error instanceof Error) {
    // Suppressed beyond the inline banner — too noisy at 5s poll.
  }

  const validators = data?.validators ?? [];
  const byId = new Map(validators.map((v) => [v.validatorId, v]));

  return (
    <aside className="validators">
      <header className="validators__header">
        <h2>Validators</h2>
        {isFetching && <span className="muted small">refreshing…</span>}
      </header>

      {data?.gatewayId && (
        <div className="validators__gateway muted small">
          via <strong>{data.gatewayId}</strong>
          {typeof data.consensusThreshold === 'number' && (
            <> · threshold {data.consensusThreshold}</>
          )}
        </div>
      )}

      <div className="validators__summary">
        <span
          className={`pill ${
            data?.consistent ? 'pill--green' : data ? 'pill--red' : 'pill--grey'
          }`}
        >
          consistent: {data ? String(data.consistent) : '—'}
        </span>
        <span
          className={`pill ${
            data?.allHeadsMatch
              ? 'pill--green'
              : data
                ? 'pill--red'
                : 'pill--grey'
          }`}
        >
          heads match: {data ? String(data.allHeadsMatch) : '—'}
        </span>
      </div>

      <ul className="validators__list">
        {EXPECTED_VALIDATORS.map((id) => {
          const v = byId.get(id);
          const reachable = !!v && v.reachable !== false && v.error == null;
          const valid = !!v?.valid;
          const dotClass = !reachable
            ? 'dot dot--red'
            : valid
              ? 'dot dot--green'
              : 'dot dot--amber';
          const publicUrl = toPublicValidatorUrl(v?.url);
          return (
            <li key={id} className="validators__item">
              <div className="validators__item-row">
                <span className={dotClass} aria-hidden="true" />
                {publicUrl ? (
                  <a
                    href={`${publicUrl}/health`}
                    target="_blank"
                    rel="noreferrer noopener"
                    title={`Open ${publicUrl}/health`}
                  >
                    <strong>{id}</strong>
                  </a>
                ) : (
                  <strong>{id}</strong>
                )}
                <span className="muted small">
                  blocks: {typeof v?.blockCount === 'number' ? v.blockCount : '—'}
                </span>
              </div>
              <div className="validators__item-row muted small">
                head: <code>{truncateHash(v?.head)}</code>
              </div>
              {v?.error && (
                <div className="validators__item-row error small">{v.error}</div>
              )}
            </li>
          );
        })}
      </ul>

      <footer className="validators__footer muted small">
        <div>
          <strong>Gateway A</strong>: <code>{GATEWAY_URLS.primary || '—'}</code>
        </div>
        <div>
          <strong>Gateway B</strong>: <code>{GATEWAY_URLS.secondary || '—'}</code>
        </div>
      </footer>

      {isError && !isLoading && (
        <div
          className="banner banner--error"
          onClick={() =>
            toast.error(
              'Validators status fetch failed',
              error instanceof Error ? error.message : String(error),
            )
          }
          role="button"
          tabIndex={0}
        >
          Could not reach <code>{GATEWAY_URLS.primary}/validators/status</code>.
          Click for details.
        </div>
      )}
    </aside>
  );
}
