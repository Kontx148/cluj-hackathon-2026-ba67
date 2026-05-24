import { useCallback, useEffect, useState } from 'react';
import { CREDENTIAL_STORAGE_KEYS } from '../../api/client';
import {
  DEMO_API_KEYS,
  INSTITUTIONS,
  type InstitutionRole,
} from '../../constants';
import { toast } from '../Toast/toastStore';

/**
 * Small event channel so other components (e.g. role-gated buttons) can
 * react to credential changes without prop drilling or a context provider.
 */
const CREDENTIAL_CHANGE_EVENT = 'election-chain:credentials-changed';

export function emitCredentialChange() {
  window.dispatchEvent(new Event(CREDENTIAL_CHANGE_EVENT));
}

export function useCurrentCredentials(): {
  institutionId: InstitutionRole | null;
  hasKey: boolean;
} {
  const read = () => ({
    institutionId: sessionStorage.getItem(
      CREDENTIAL_STORAGE_KEYS.institutionId,
    ) as InstitutionRole | null,
    hasKey: !!sessionStorage.getItem(CREDENTIAL_STORAGE_KEYS.apiKey),
  });
  const [state, setState] = useState(read);
  useEffect(() => {
    const handler = () => setState(read());
    window.addEventListener(CREDENTIAL_CHANGE_EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(CREDENTIAL_CHANGE_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);
  return state;
}

export function CredentialBar() {
  const [role, setRole] = useState<InstitutionRole>(() => {
    const stored = sessionStorage.getItem(
      CREDENTIAL_STORAGE_KEYS.institutionId,
    ) as InstitutionRole | null;
    return stored && INSTITUTIONS.includes(stored) ? stored : 'Admin';
  });
  const [apiKey, setApiKey] = useState<string>(
    () => sessionStorage.getItem(CREDENTIAL_STORAGE_KEYS.apiKey) ?? '',
  );
  const [saved, setSaved] = useState<boolean>(() => {
    return !!sessionStorage.getItem(CREDENTIAL_STORAGE_KEYS.apiKey);
  });

  const save = useCallback(() => {
    sessionStorage.setItem(CREDENTIAL_STORAGE_KEYS.institutionId, role);
    if (apiKey) {
      sessionStorage.setItem(CREDENTIAL_STORAGE_KEYS.apiKey, apiKey);
    } else {
      sessionStorage.removeItem(CREDENTIAL_STORAGE_KEYS.apiKey);
    }
    setSaved(true);
    emitCredentialChange();
    toast.success(`Signed in as ${role}`);
  }, [role, apiKey]);

  const clear = useCallback(() => {
    sessionStorage.removeItem(CREDENTIAL_STORAGE_KEYS.institutionId);
    sessionStorage.removeItem(CREDENTIAL_STORAGE_KEYS.apiKey);
    setApiKey('');
    setSaved(false);
    emitCredentialChange();
    toast.info('Credentials cleared');
  }, []);

  return (
    <header className="credential-bar">
      <div className="credential-bar__brand">
        <span className="credential-bar__brand-mark" aria-hidden="true">
          ◆
        </span>
        <div>
          <div className="credential-bar__title">Votera</div>
          <div className="credential-bar__subtitle">Operations</div>
        </div>
      </div>

      <form
        className="credential-bar__form"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label className="credential-bar__field">
          <span className="credential-bar__label">Role</span>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value as InstitutionRole);
              setSaved(false);
            }}
          >
            {INSTITUTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="credential-bar__field credential-bar__field--key">
          <span className="credential-bar__label">API key</span>
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={apiKey}
            placeholder={DEMO_API_KEYS[role]}
            onChange={(e) => {
              setApiKey(e.target.value);
              setSaved(false);
            }}
          />
        </label>
        <div className="credential-bar__actions">
          <button type="submit" className="btn btn--primary">
            {saved ? 'Update' : 'Save for session'}
          </button>
          {saved && (
            <button type="button" className="btn btn--ghost" onClick={clear}>
              Sign out
            </button>
          )}
        </div>
      </form>
    </header>
  );
}
