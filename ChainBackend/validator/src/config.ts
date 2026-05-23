export const config = {
  port: Number(process.env.PORT || 4101),
  validatorId: process.env.VALIDATOR_ID || 'validator-unknown',
  privateKey: process.env.VALIDATOR_PRIVATE_KEY || 'mock-key',

  chainStoragePath:
    process.env.CHAIN_STORAGE_PATH ||
    `/data/${process.env.VALIDATOR_ID || 'validator'}-chain.json`,

  consensusThreshold: Number(process.env.CONSENSUS_THRESHOLD || 2),

  /**
   * URLs of every validator (including this one). Currently unused by the
   * prototype – kept for parity with the gateway config and to enable a
   * future peer sync / catch-up implementation.
   *
   * TODO: implement validator-to-validator catch-up so that a validator
   * which missed a commit can pull the missing blocks from peers.
   */
  validatorUrls: (
    process.env.VALIDATOR_URLS ||
    'http://validator-1:4101,http://validator-2:4102,http://validator-3:4103'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};
