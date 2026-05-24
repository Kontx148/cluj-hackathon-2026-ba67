import { GATEWAY_URLS } from '../../api/client';
import { DEMO_API_KEYS } from '../../constants';

export function AppFooter() {
  return (
    <footer className="app-footer" aria-label="Deployment info">
      <div className="app-footer__inner">
        <span className="app-footer__gateways">
          <span>
            Gateway A{' '}
            <a href={GATEWAY_URLS.primary} target="_blank" rel="noreferrer noopener">
              {GATEWAY_URLS.primary || '—'}
            </a>
          </span>
          <span className="app-footer__sep">·</span>
          <span>
            Gateway B{' '}
            <a
              href={GATEWAY_URLS.secondary}
              target="_blank"
              rel="noreferrer noopener"
            >
              {GATEWAY_URLS.secondary || '—'}
            </a>
          </span>
        </span>
        <span className="app-footer__keys">
          Demo keys:{' '}
          {Object.entries(DEMO_API_KEYS).map(([role, key], i, arr) => (
            <span key={role}>
              <code>{key}</code>
              {i < arr.length - 1 ? ', ' : ''}
            </span>
          ))}
          . sessionStorage only.
        </span>
      </div>
    </footer>
  );
}
