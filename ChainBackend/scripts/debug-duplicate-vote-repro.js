/**
 * Reproduces duplicate voting: same digital ID, two fresh anonymous tokens.
 * Logs evidence to the debug ingest endpoint (session 3c82ea).
 */
const { publicEncrypt, constants } = require('crypto');

const gatewayBase = process.env.GATEWAY_BASE || 'http://165.232.67.137:4001';
const electionId = process.env.ELECTION_ID || 'RO-3';
const digitalId = process.env.DIGITAL_ID || 'RO123456789';
const ingest =
  'http://127.0.0.1:7528/ingest/9b39a962-5f44-4917-9c64-0e70bdd0a08a';

const fs = require('fs');
const path = require('path');

const debugLogPath = path.join(
  __dirname,
  '..',
  '..',
  'debug-3c82ea.log',
);

async function agentLog(hypothesisId, location, message, data) {
  const body = {
    sessionId: '3c82ea',
    location,
    message,
    data,
    timestamp: Date.now(),
    hypothesisId,
    runId: process.env.RUN_ID || 'pre-fix',
  };
  try {
    fs.appendFileSync(debugLogPath, `${JSON.stringify(body)}\n`, 'utf8');
  } catch (_) {
    // ignore
  }
  try {
    await fetch(ingest, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '3c82ea',
      },
      body: JSON.stringify(body),
    });
  } catch (_) {
    // ignore
  }
}

function encryptDigitalId(digitalId, publicKeyPem) {
  return publicEncrypt(
    {
      key: publicKeyPem,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(digitalId, 'utf8'),
  ).toString('base64');
}

function randomHex(bytes) {
  const crypto = require('crypto');
  return crypto.randomBytes(bytes).toString('hex');
}

async function postVote(token, encryptedDigitalId) {
  const res = await fetch(`${gatewayBase}/votes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      electionId,
      districtId: 'CJ-01',
      anonymousTokenHash: token,
      candidateId: 'candidate-a',
      encryptedVote: `mock-enc:${electionId}:[1,0,0]`,
      encryptedDigitalId,
      voterProof: `mock-voter-proof:${randomHex(8)}`,
      timestamp: new Date().toISOString(),
    }),
  });
  const text = await res.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch (_) {
    json = { raw: text };
  }
  return { status: res.status, json };
}

async function main() {
  const pkRes = await fetch(
    `${gatewayBase}/elections/${encodeURIComponent(electionId)}/public-key`,
  );
  const pkJson = await pkRes.json();
  const publicKey = pkJson.publicKey;
  const encryptedDigitalId = encryptDigitalId(digitalId, publicKey);

  const token1 = randomHex(32);
  const token2 = randomHex(32);

  await agentLog('B', 'debug-duplicate-vote-repro.js', 'submitting vote 1', {
    electionId,
    token1Prefix: token1.slice(0, 12),
    sameEncryptedDigitalId: true,
  });
  const vote1 = await postVote(token1, encryptedDigitalId);

  await agentLog('B', 'debug-duplicate-vote-repro.js', 'submitting vote 2', {
    electionId,
    token2Prefix: token2.slice(0, 12),
    tokensDifferent: token1 !== token2,
    sameEncryptedDigitalId: true,
  });
  const vote2 = await postVote(token2, encryptedDigitalId);

  await agentLog('A', 'debug-duplicate-vote-repro.js', 'duplicate vote results', {
    vote1Status: vote1.status,
    vote2Status: vote2.status,
    bothAccepted: vote1.status === 201 && vote2.status === 201,
    vote2Error: vote2.json.error || null,
  });

  console.log('vote1', vote1.status, vote1.json.error || 'ok');
  console.log('vote2', vote2.status, vote2.json.error || 'ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
