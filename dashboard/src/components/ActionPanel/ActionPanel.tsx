import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  approveElection,
  finishElection,
  freezeElection,
  openElection,
  requestDecryption,
  tallyElection,
} from '../../api/elections';
import type { Election, LifecycleActionResponse } from '../../api/types';
import type { InstitutionRole } from '../../constants';
import { useCurrentCredentials } from '../CredentialBar/CredentialBar';
import { toast } from '../Toast/toastStore';

interface Props {
  election: Election;
}

type ActionId =
  | 'approve'
  | 'open'
  | 'freeze'
  | 'tally'
  | 'request-decryption'
  | 'finish';

interface ActionSpec {
  id: ActionId;
  label: string;
  description: string;
  call: (id: string) => Promise<LifecycleActionResponse>;
  allowedRoles: InstitutionRole[] | 'any';
}

const ACTION_SPECS: Record<ActionId, ActionSpec> = {
  approve: {
    id: 'approve',
    label: 'Approve',
    description: 'Record an institutional approval for this proposal.',
    call: approveElection,
    allowedRoles: ['AEP', 'BEC', 'COURT'],
  },
  open: {
    id: 'open',
    label: 'Open voting',
    description: 'Transition APPROVED → OPEN. Vote intake begins.',
    call: openElection,
    allowedRoles: 'any',
  },
  freeze: {
    id: 'freeze',
    label: 'Freeze',
    description: 'Stop accepting new votes (OPEN → FROZEN).',
    call: freezeElection,
    allowedRoles: 'any',
  },
  tally: {
    id: 'tally',
    label: 'Run tally',
    description: 'Begin tallying frozen ballots (FROZEN → TALLYING).',
    call: tallyElection,
    allowedRoles: 'any',
  },
  'request-decryption': {
    id: 'request-decryption',
    label: 'Request threshold decryption',
    description:
      'Trigger the decryption ceremony (TALLYING → DECRYPTED).',
    call: requestDecryption,
    allowedRoles: 'any',
  },
  finish: {
    id: 'finish',
    label: 'Finish election',
    description: 'Publish the final tally on-chain (DECRYPTED → FINISHED).',
    call: finishElection,
    allowedRoles: 'any',
  },
};

function actionsForStatus(status: Election['status']): ActionSpec[] {
  switch (status) {
    case 'PROPOSED':
      return [ACTION_SPECS.approve];
    case 'APPROVED':
      return [ACTION_SPECS.open];
    case 'OPEN':
      return [ACTION_SPECS.freeze];
    case 'FROZEN':
      return [ACTION_SPECS.tally];
    case 'TALLYING':
      return [ACTION_SPECS['request-decryption']];
    case 'DECRYPTED':
      return [ACTION_SPECS.finish];
    case 'FINISHED':
    default:
      return [];
  }
}

export function ActionPanel({ election }: Props) {
  const qc = useQueryClient();
  const { institutionId } = useCurrentCredentials();
  const actions = actionsForStatus(election.status);

  const alreadyApprovedBy = useMemo(() => {
    const ids = (election.approvals ?? []).map((a) =>
      a.institutionId?.toUpperCase(),
    );
    return new Set(ids);
  }, [election.approvals]);

  const mutation = useMutation<
    LifecycleActionResponse,
    Error,
    { spec: ActionSpec }
  >({
    mutationFn: ({ spec }) => spec.call(election.electionId),
    onSuccess: (resp, vars) => {
      const blockHash = resp.block?.blockHash ?? resp.blockHash;
      toast.success(
        `${vars.spec.label} succeeded`,
        blockHash ? `block ${blockHash}` : undefined,
      );
      qc.invalidateQueries({ queryKey: ['elections'] });
      qc.invalidateQueries({ queryKey: ['election', election.electionId] });
    },
    onError: (err, vars) => {
      toast.error(`${vars.spec.label} failed`, err.message);
    },
  });

  if (election.status === 'FINISHED') {
    return (
      <section className="action-panel">
        <h2>Lifecycle</h2>
        <p className="muted">
          This election is <strong>FINISHED</strong>. The published tally below
          is final and recorded on-chain.
        </p>
      </section>
    );
  }

  if (actions.length === 0) {
    return (
      <section className="action-panel">
        <h2>Lifecycle</h2>
        <p className="muted">No action is available for status <code>{election.status}</code>.</p>
      </section>
    );
  }

  return (
    <section className="action-panel">
      <h2>Lifecycle</h2>
      <ul className="action-panel__list">
        {actions.map((action) => {
          const allowed =
            action.allowedRoles === 'any' ||
            (institutionId &&
              (institutionId === 'Admin' ||
                action.allowedRoles.includes(institutionId)));
          const alreadyDone =
            action.id === 'approve' &&
            institutionId &&
            institutionId !== 'Admin' &&
            alreadyApprovedBy.has(institutionId);
          const disabled =
            !allowed || !!alreadyDone || mutation.isPending;
          const isInflight =
            mutation.isPending && mutation.variables?.spec.id === action.id;

          let helpText: string | null = null;
          if (!institutionId) {
            helpText = 'Sign in (top bar) to call this action.';
          } else if (!allowed) {
            helpText = `Requires role: ${
              action.allowedRoles === 'any' ? 'any' : action.allowedRoles.join(', ')
            }.`;
          } else if (alreadyDone) {
            helpText = `${institutionId} has already approved this election.`;
          }

          return (
            <li key={action.id} className="action-panel__item">
              <div className="action-panel__item-text">
                <div className="action-panel__item-label">{action.label}</div>
                <div className="action-panel__item-desc muted small">
                  {action.description}
                </div>
                {helpText && (
                  <div className="action-panel__item-help small">{helpText}</div>
                )}
              </div>
              <button
                type="button"
                className="btn btn--primary"
                disabled={disabled}
                onClick={() => mutation.mutate({ spec: action })}
              >
                {isInflight ? <span className="spinner" /> : action.label}
              </button>
            </li>
          );
        })}
      </ul>

      {mutation.isError && (
        <div className="banner banner--error">
          {mutation.error?.message ?? 'Action failed.'}
        </div>
      )}
      {mutation.isSuccess && (
        <div className="banner banner--success">
          Action committed.{' '}
          {(mutation.data?.block?.blockHash ?? mutation.data?.blockHash) && (
            <>
              Block <code>{mutation.data?.block?.blockHash ?? mutation.data?.blockHash}</code>.
            </>
          )}
        </div>
      )}
    </section>
  );
}
