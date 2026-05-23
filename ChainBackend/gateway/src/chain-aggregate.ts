import { canonicalize } from './canonical';
import { broadcastGet } from './validators-client';

export interface ValidatorView<T> {
  validatorId: string;
  url: string;
  data?: T;
  error?: string;
}

export interface AggregateRead<T> {
  consistent: boolean;
  result?: T;
  views: ValidatorView<T>[];
  warning?: string;
  responsiveValidators: number;
  totalValidators: number;
}

/**
 * Forward a GET to every validator and pick the response that the
 * majority returned. Sets `consistent: false` and a `warning` when
 * validators diverge so that the front-end can surface the discrepancy.
 *
 * TODO: a production gateway would only trust answers signed by their
 * source validator and would attest the merged view back to the caller.
 */
export async function readMajority<T>(
  path: string,
  identityFn: (data: T) => string = canonicalize,
): Promise<AggregateRead<T>> {
  const raw = await broadcastGet<T>(path);
  const views: ValidatorView<T>[] = raw.map((r) => {
    if (r.ok && r.data !== undefined) {
      const validatorId = readValidatorId(r.data) || r.url;
      return { validatorId, url: r.url, data: r.data };
    }
    return { validatorId: r.url, url: r.url, error: r.error };
  });

  const responsive = views.filter((v) => v.data !== undefined);
  if (responsive.length === 0) {
    return {
      consistent: false,
      views,
      warning: 'No validators responded successfully',
      responsiveValidators: 0,
      totalValidators: views.length,
    };
  }

  const buckets = new Map<string, { data: T; count: number }>();
  for (const v of responsive) {
    const id = identityFn(v.data!);
    const e = buckets.get(id) || { data: v.data!, count: 0 };
    e.count += 1;
    buckets.set(id, e);
  }
  let best: { data: T; count: number } | null = null;
  for (const b of buckets.values()) {
    if (!best || b.count > best.count) best = b;
  }

  const consistent = buckets.size === 1 && responsive.length === views.length;
  return {
    consistent,
    result: best!.data,
    views,
    warning: consistent
      ? undefined
      : buckets.size === 1
        ? `${views.length - responsive.length} validator(s) unreachable`
        : 'Validators returned divergent data',
    responsiveValidators: responsive.length,
    totalValidators: views.length,
  };
}

function readValidatorId(data: unknown): string | undefined {
  if (data && typeof data === 'object') {
    const v = (data as Record<string, unknown>).validatorId;
    if (typeof v === 'string') return v;
  }
  return undefined;
}
