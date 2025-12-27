import assert from 'assert';
import crypto from 'crypto';
import { test } from 'node:test';

import { chapaWebhook } from '../controllers/paymentController/paymentController.js';

// We'll invoke the handler with a mocked req/res objects.
// The tests focus on signature verification and payload parsing.

function makeMockReq(rawJsonBuffer, headers = {}) {
  return {
    body: rawJsonBuffer,
    headers,
  };
}

function makeMockRes() {
  const res = {};
  res.statusCode = 200;
  res._body = null;
  res.status = function (code) { this.statusCode = code; return this; };
  res.send = function (body) { this._body = body; return this; };
  res.json = function (obj) { this._body = obj; return this; };
  return res;
}

test('chapaWebhook rejects invalid JSON payload', async () => {
  const badBuffer = Buffer.from('not a json');
  const req = makeMockReq(badBuffer, {});
  const res = makeMockRes();

  const result = await chapaWebhook(req, res);
  // expecting 400 Invalid payload
  assert.strictEqual(res.statusCode, 400);
});

test('chapaWebhook verifies signature when secret provided', async () => {
  // prepare a valid payload
  const payload = { status: 'success', data: { status: 'success', tx_ref: 'Abugida-123' } };
  const raw = Buffer.from(JSON.stringify(payload));

  // set env secret for handler
  process.env.CHAPA_WEBHOOK_SECRET = 'testsecret';

  const sig = crypto.createHmac('sha256', process.env.CHAPA_WEBHOOK_SECRET).update(raw).digest('hex');

  const req = makeMockReq(raw, { 'x-chapa-signature': sig });
  const res = makeMockRes();

  // Since the test environment DB and models are not connected, the handler will attempt to look up payments
  // and likely return 404 (Payment not found). The important part is that signature verification passes and
  // we do not get a 401/400.
  await chapaWebhook(req, res);
  assert.notStrictEqual(res.statusCode, 401, 'Signature should be accepted');
});

