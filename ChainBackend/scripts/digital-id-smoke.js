const { generateKeyPairSync, privateDecrypt, publicEncrypt, constants } = require('crypto');
const fs = require('fs');
const path = require('path');

const gatewayBase = process.env.GATEWAY_BASE || 'http://localhost:4001';

function generateElectionKeyPair() {
  return generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
}

function encryptDigitalId(digitalId, publicKey) {
  return publicEncrypt(
    {
      key: publicKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(digitalId, 'utf8'),
  ).toString('base64');
}

function decryptDigitalId(encryptedDigitalId, privateKey) {
  return privateDecrypt(
    {
      key: privateKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(encryptedDigitalId, 'base64'),
  ).toString('utf8');
}

function loadEligibility() {
  const file = path.join(__dirname, '..', 'validator', 'data', 'eligible-voters.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

async function request(method, url, body, headers = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  return { status: response.status, json };
}

async function run() {
  console.log('1. generating election key pair');
  const { publicKey, privateKey } = generateElectionKeyPair();

  console.log('2. encrypting eligible digital ID with public key');
  const encryptedEligible = encryptDigitalId('RO123456789', publicKey);

  console.log('3. decrypting with private key');
  const decrypted = decryptDigitalId(encryptedEligible, privateKey);
  if (decrypted !== 'RO123456789') throw new Error('decrypt mismatch');

  console.log('4. checking local eligibility JSON');
  const eligible = loadEligibility();
  if (!eligible.some((v) => v.digitalId === decrypted)) {
    throw new Error('expected RO123456789 to be eligible');
  }
  if (eligible.some((v) => v.digitalId === 'RO000000000')) {
    throw new Error('expected RO000000000 to be ineligible');
  }

  console.log('5-6. live gateway vote checks (requires docker compose up)');
  const electionId = `DIGITAL-ID-SMOKE-${Date.now()}`;
  const startsAt = new Date(Date.now() - 60_000).toISOString();
  const endsAt = new Date(Date.now() + 60 * 60_000).toISOString();

  await request(
    'POST',
    `${gatewayBase}/elections/proposals`,
    {
      electionId,
      name: 'Digital ID Smoke Election',
      type: 'SMOKE',
      districts: ['CJ-01'],
      candidates: [
        { id: 'candidate-a', name: 'Candidate A' },
        { id: 'candidate-b', name: 'Candidate B' },
      ],
      startsAt,
      endsAt,
      requiredApprovals: 2,
    },
    { 'x-institution-id': 'AEP', 'x-api-key': 'dev-aep-key' },
  );
  await request('POST', `${gatewayBase}/elections/${electionId}/approve`, undefined, {
    'x-institution-id': 'BEC',
    'x-api-key': 'dev-bec-key',
  });
  await request('POST', `${gatewayBase}/elections/${electionId}/approve`, undefined, {
    'x-institution-id': 'COURT',
    'x-api-key': 'dev-court-key',
  });
  await request('POST', `${gatewayBase}/elections/${electionId}/open`, undefined, {
    'x-api-key': 'dev-admin-key',
  });

  const publicKeyResponse = await request('GET', `${gatewayBase}/elections/${electionId}/public-key`);
  if (publicKeyResponse.status !== 200) {
    throw new Error(`public-key fetch failed: ${publicKeyResponse.status}`);
  }
  const electionPublicKey = publicKeyResponse.json.publicKey;

  const eligibleVote = await request('POST', `${gatewayBase}/votes`, {
    electionId,
    districtId: 'CJ-01',
    anonymousTokenHash: 'eligible-token',
    candidateId: 'candidate-a',
    encryptedDigitalId: encryptDigitalId('RO123456789', electionPublicKey),
    voterProof: 'mock-zk-proof',
    timestamp: new Date().toISOString(),
  });
  if (eligibleVote.status !== 201) {
    throw new Error(`eligible voter was not accepted: ${eligibleVote.status} ${JSON.stringify(eligibleVote.json)}`);
  }

  const ineligibleVote = await request('POST', `${gatewayBase}/votes`, {
    electionId,
    districtId: 'CJ-01',
    anonymousTokenHash: 'ineligible-token',
    candidateId: 'candidate-b',
    encryptedDigitalId: encryptDigitalId('RO000000000', electionPublicKey),
    voterProof: 'mock-zk-proof',
    timestamp: new Date().toISOString(),
  });
  if (ineligibleVote.status !== 403 || ineligibleVote.json.error !== 'VOTER_NOT_ELIGIBLE') {
    throw new Error(`ineligible voter was not rejected correctly: ${ineligibleVote.status} ${JSON.stringify(ineligibleVote.json)}`);
  }

  console.log('OK: key generation, encryption/decryption, eligibility, accept, and reject checks passed');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
