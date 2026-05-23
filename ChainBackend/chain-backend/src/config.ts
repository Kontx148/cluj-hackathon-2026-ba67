/**
 * Runtime configuration loaded from environment variables.
 * Defaults match the values used in docker-compose.yml so the service is
 * also runnable locally with `npm run dev` for quick experiments.
 */
export const config = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',

  validatorUrls: [
    process.env.VALIDATOR_1_URL || 'http://validator-1:4101',
    process.env.VALIDATOR_2_URL || 'http://validator-2:4102',
  ],
  consensusThreshold: Number(process.env.CONSENSUS_THRESHOLD || 2),

  chainStorageMode: process.env.CHAIN_STORAGE_MODE || 'file',
  chainStoragePath: process.env.CHAIN_STORAGE_PATH || '/data/chain.json',

  adminApiKey: process.env.ADMIN_API_KEY || 'dev-admin-key',

  apiKeys: {
    AEP: process.env.AEP_API_KEY || 'dev-aep-key',
    BEC: process.env.BEC_API_KEY || 'dev-bec-key',
    COURT: process.env.COURT_API_KEY || 'dev-court-key',
  } as Record<string, string>,
};

export interface InstitutionDef {
  id: string;
  name: string;
  canPropose: boolean;
  canApprove: boolean;
}

/**
 * Authorized institutions for the prototype. In a real deployment this list
 * would be governed by a public registry / on-chain governance contract.
 */
export const INSTITUTIONS: InstitutionDef[] = [
  {
    id: 'AEP',
    name: 'Autoritatea Electorala Permanenta',
    canPropose: true,
    canApprove: true,
  },
  {
    id: 'BEC',
    name: 'Biroul Electoral Central',
    canPropose: false,
    canApprove: true,
  },
  {
    id: 'COURT',
    name: 'Constitutional Court',
    canPropose: false,
    canApprove: true,
  },
];
