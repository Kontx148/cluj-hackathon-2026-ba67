import type { ElectionStatus } from '../../constants';

const STATUS_CLASS: Record<ElectionStatus, string> = {
  PROPOSED: 'badge badge--amber',
  APPROVED: 'badge badge--green',
  OPEN: 'badge badge--primary',
  FROZEN: 'badge badge--grey',
  TALLYING: 'badge badge--amber',
  DECRYPTED: 'badge badge--green',
  FINISHED: 'badge badge--grey',
};

export function StatusBadge({ status }: { status: ElectionStatus | string }) {
  const className = STATUS_CLASS[status as ElectionStatus] ?? 'badge badge--grey';
  return <span className={className}>{status}</span>;
}
