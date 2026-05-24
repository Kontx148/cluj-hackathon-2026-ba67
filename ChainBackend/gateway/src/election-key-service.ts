import { generateKeyPairSync } from 'crypto';

export interface ElectionKeyPair {
  electionPublicKey: string;
  electionPrivateKey: string;
}

export class ElectionKeyService {
  /**
   * Generate an election-scoped RSA key pair.
   *
   * The public key is returned to mobile clients. The private key is committed
   * into validator state for this prototype so validators can decrypt
   * encryptedDigitalId during vote validation.
   *
   * TODO: replace with distributed key generation so no single process ever
   * creates or sees the complete private key.
   */
  generateElectionKeyPair(): ElectionKeyPair {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return {
      electionPublicKey: publicKey,
      electionPrivateKey: privateKey,
    };
  }
}

export const electionKeyService = new ElectionKeyService();
