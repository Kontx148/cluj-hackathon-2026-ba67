export const config = {
  port: Number(process.env.PORT || 4001),
  gatewayId: process.env.GATEWAY_ID || 'gateway-unknown',

  validatorUrls: (
    process.env.VALIDATOR_URLS ||
    'http://validator-1:4101,http://validator-2:4102,http://validator-3:4103'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  consensusThreshold: Number(process.env.CONSENSUS_THRESHOLD || 2),

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
