import { useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { proposeElection } from '../api/elections';
import type { Candidate, ProposeElectionPayload } from '../api/types';
import { useCurrentCredentials } from '../components/CredentialBar/CredentialBar';
import { toast } from '../components/Toast/toastStore';
import { ELECTION_TYPES, type ElectionType } from '../constants';

const ID_PATTERN = /^[A-Za-z0-9_-]+$/;

function toIsoOrEmpty(local: string): string {
  if (!local) return '';
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString();
}

export function ProposeElectionPage() {
  const navigate = useNavigate();
  const { institutionId, hasKey } = useCurrentCredentials();
  const canSubmit =
    hasKey && (institutionId === 'AEP' || institutionId === 'Admin');

  const [electionId, setElectionId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<ElectionType>('PRESIDENTIAL');
  const [districtsRaw, setDistrictsRaw] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([
    { id: 'candidate-a', name: 'Candidate A' },
    { id: 'candidate-b', name: 'Candidate B' },
  ]);
  const [startsAtLocal, setStartsAtLocal] = useState('');
  const [endsAtLocal, setEndsAtLocal] = useState('');
  const [requiredApprovals, setRequiredApprovals] = useState(2);
  const [electionPublicKey, setElectionPublicKey] = useState('');

  const districts = useMemo(
    () =>
      districtsRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [districtsRaw],
  );

  const validationError = useMemo(() => {
    if (!electionId) return 'Election ID is required.';
    if (!ID_PATTERN.test(electionId))
      return 'Election ID may only contain letters, digits, hyphens and underscores.';
    if (!name) return 'Name is required.';
    if (districts.length === 0) return 'At least one district is required.';
    if (candidates.length < 2) return 'At least two candidates are required.';
    for (const c of candidates) {
      if (!c.id || !c.name) return 'Every candidate needs both an id and a name.';
      if (!ID_PATTERN.test(c.id))
        return `Candidate id "${c.id}" must be URL-safe.`;
    }
    if (!startsAtLocal) return 'Start time is required.';
    if (!endsAtLocal) return 'End time is required.';
    const start = new Date(startsAtLocal).getTime();
    const end = new Date(endsAtLocal).getTime();
    if (Number.isNaN(start) || Number.isNaN(end))
      return 'Start/end times are invalid.';
    if (end <= start) return 'End time must be after start time.';
    if (requiredApprovals < 1 || requiredApprovals > 3)
      return 'requiredApprovals must be between 1 and 3.';
    return null;
  }, [
    electionId,
    name,
    districts,
    candidates,
    startsAtLocal,
    endsAtLocal,
    requiredApprovals,
  ]);

  const mutation = useMutation({
    mutationFn: (payload: ProposeElectionPayload) => proposeElection(payload),
    onSuccess: (resp) => {
      const created = resp.election?.electionId ?? electionId;
      const blockHash = resp.block?.blockHash ?? resp.blockHash;
      toast.success(
        'Election proposed',
        blockHash ? `block ${blockHash}` : undefined,
      );
      navigate(`/elections/${encodeURIComponent(created)}`);
    },
    onError: (err: Error) => {
      toast.error('Propose failed', err.message);
    },
  });

  function addCandidate() {
    setCandidates((cs) => [
      ...cs,
      { id: `candidate-${String.fromCharCode(97 + cs.length)}`, name: '' },
    ]);
  }

  function removeCandidate(index: number) {
    setCandidates((cs) => cs.filter((_, i) => i !== index));
  }

  function updateCandidate(index: number, field: keyof Candidate, value: string) {
    setCandidates((cs) =>
      cs.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validationError) return;
    const payload: ProposeElectionPayload = {
      electionId,
      name,
      type,
      districts,
      candidates,
      startsAt: toIsoOrEmpty(startsAtLocal),
      endsAt: toIsoOrEmpty(endsAtLocal),
      requiredApprovals,
      ...(electionPublicKey ? { electionPublicKey } : {}),
    };
    mutation.mutate(payload);
  }

  return (
    <div className="propose">
      <div className="page-breadcrumb">
        <Link to="/">← Back to elections</Link>
      </div>

      <header className="page-header">
        <div>
          <h1>Propose new election</h1>
          <p className="muted">
            A proposal becomes <code>PROPOSED</code> on-chain immediately and
            requires institutional approvals before it can be opened.
          </p>
        </div>
      </header>

      {!canSubmit && (
        <div className="banner banner--warning">
          You are signed in as <strong>{institutionId ?? 'no role'}</strong>. Only{' '}
          <code>AEP</code> or <code>Admin</code> may propose elections.
        </div>
      )}

      <form className="card form" onSubmit={onSubmit}>
        <div className="form__grid">
          <label className="form__field">
            <span>Election ID</span>
            <input
              type="text"
              value={electionId}
              onChange={(e) => setElectionId(e.target.value)}
              placeholder="RO-PRESIDENTIAL-2029"
              required
            />
            <small className="muted">
              URL-safe. Letters, digits, <code>-</code>, <code>_</code>.
            </small>
          </label>

          <label className="form__field">
            <span>Display name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Romanian Presidential Election 2029"
              required
            />
          </label>

          <label className="form__field">
            <span>Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ElectionType)}
            >
              {ELECTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="form__field">
            <span>Required approvals</span>
            <input
              type="number"
              min={1}
              max={3}
              value={requiredApprovals}
              onChange={(e) => setRequiredApprovals(Number(e.target.value))}
            />
            <small className="muted">Minimum 1, maximum 3.</small>
          </label>

          <label className="form__field">
            <span>Districts</span>
            <input
              type="text"
              value={districtsRaw}
              onChange={(e) => setDistrictsRaw(e.target.value)}
              placeholder="CJ-01, B-01, BV-01"
              required
            />
            <small className="muted">
              Comma-separated district codes. Parsed:{' '}
              {districts.length
                ? districts.map((d) => <code key={d}>{d}</code>)
                : '—'}
            </small>
          </label>

          <label className="form__field">
            <span>Starts at (local)</span>
            <input
              type="datetime-local"
              value={startsAtLocal}
              onChange={(e) => setStartsAtLocal(e.target.value)}
              required
            />
            <small className="muted">
              ISO on submit:{' '}
              <code>{toIsoOrEmpty(startsAtLocal) || '—'}</code>
            </small>
          </label>

          <label className="form__field">
            <span>Ends at (local)</span>
            <input
              type="datetime-local"
              value={endsAtLocal}
              onChange={(e) => setEndsAtLocal(e.target.value)}
              required
            />
            <small className="muted">
              ISO on submit:{' '}
              <code>{toIsoOrEmpty(endsAtLocal) || '—'}</code>
            </small>
          </label>

          <label className="form__field form__field--wide">
            <span>Election public key (optional)</span>
            <input
              type="text"
              value={electionPublicKey}
              onChange={(e) => setElectionPublicKey(e.target.value)}
              placeholder="Leave blank to let the gateway auto-fill"
            />
          </label>
        </div>

        <fieldset className="form__fieldset">
          <legend>Candidates</legend>
          <ul className="candidate-list">
            {candidates.map((c, i) => (
              <li key={i} className="candidate-list__item">
                <input
                  type="text"
                  value={c.id}
                  onChange={(e) => updateCandidate(i, 'id', e.target.value)}
                  placeholder="candidate-a"
                  aria-label={`Candidate ${i + 1} id`}
                />
                <input
                  type="text"
                  value={c.name}
                  onChange={(e) => updateCandidate(i, 'name', e.target.value)}
                  placeholder="Candidate A"
                  aria-label={`Candidate ${i + 1} name`}
                />
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  onClick={() => removeCandidate(i)}
                  disabled={candidates.length <= 2}
                  title={
                    candidates.length <= 2
                      ? 'Minimum two candidates required'
                      : 'Remove'
                  }
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={addCandidate}
          >
            + Add candidate
          </button>
        </fieldset>

        {(validationError || mutation.isError) && (
          <div className="banner banner--error">
            {validationError ??
              (mutation.error instanceof Error
                ? mutation.error.message
                : 'Submit failed')}
          </div>
        )}

        <div className="form__actions">
          <Link to="/" className="btn btn--ghost">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={
              !canSubmit || !!validationError || mutation.isPending
            }
          >
            {mutation.isPending ? <span className="spinner" /> : 'Submit proposal'}
          </button>
        </div>
      </form>
    </div>
  );
}
