import { constants, privateDecrypt } from 'crypto';

export class DigitalIdDecryptionService {
  decryptWithElectionPrivateKey(
    encryptedDigitalId: string,
    electionPrivateKey: string,
  ): string {
    const ciphertext = Buffer.from(encryptedDigitalId, 'base64');
    return privateDecrypt(
      {
        key: electionPrivateKey,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      ciphertext,
    ).toString('utf8');
  }
}

export const digitalIdDecryptionService = new DigitalIdDecryptionService();
