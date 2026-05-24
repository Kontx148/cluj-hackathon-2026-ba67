import type { ElectionStatus } from '../../constants';

const STATUS_CLASS: Record<ElectionStatus, string> = {
  PROPOSED: 'badge badge--blue',
  APPROVED: 'badge badge--blue',
  OPEN: 'badge badge--green',
  FROZEN: 'badge badge--grey',
  TALLYING: 'badge badge--amber',
  DECRYPTED: 'badge badge--amber',
  FINISHED: 'badge badge--teal',
};

export function StatusBadge({ status }: { status: ElectionStatus | string }) {
  const className = STATUS_CLASS[status as ElectionStatus] ?? 'badge badge--grey';
  return <span className={className}>{status}</span>;
}
