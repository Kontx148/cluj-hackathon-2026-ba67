import type { NextFunction, Request, Response } from 'express';
import { INSTITUTIONS, config } from './config';

export interface AuthInfo {
  institutionId?: string;
  isAdmin: boolean;
}

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthInfo;
  }
}

interface AuthOptions {
  /** Caller must be allowed to propose elections (e.g. AEP). */
  requireProposer?: boolean;
  /** Caller must be allowed to approve elections (AEP, BEC, COURT). */
  requireApprover?: boolean;
}

/**
 * Header-based institution auth for the prototype.
 *
 * Headers:
 *   x-institution-id: AEP | BEC | COURT
 *   x-api-key:        <institution api key>  OR  ADMIN_API_KEY
 *
 * In production this would be replaced by mutual TLS plus signature-based
 * request authentication tied to each institution's on-chain identity.
 */
export function authenticate(opts: AuthOptions = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.header('x-api-key') || '';
    const institutionId = (req.header('x-institution-id') || '').toUpperCase();

    if (apiKey && apiKey === config.adminApiKey) {
      req.auth = { isAdmin: true, institutionId: institutionId || undefined };
      return next();
    }

    if (!institutionId) {
      return res.status(401).json({ error: 'Missing x-institution-id header' });
    }

    const expected = config.apiKeys[institutionId];
    if (!expected || expected !== apiKey) {
      return res.status(401).json({ error: 'Invalid institution credentials' });
    }

    const inst = INSTITUTIONS.find((i) => i.id === institutionId);
    if (!inst) {
      return res.status(401).json({ error: 'Unknown institution' });
    }

    if (opts.requireProposer && !inst.canPropose) {
      return res
        .status(403)
        .json({ error: `Institution ${institutionId} is not allowed to propose elections` });
    }
    if (opts.requireApprover && !inst.canApprove) {
      return res
        .status(403)
        .json({ error: `Institution ${institutionId} is not allowed to approve elections` });
    }

    req.auth = { institutionId, isAdmin: false };
    next();
  };
}
