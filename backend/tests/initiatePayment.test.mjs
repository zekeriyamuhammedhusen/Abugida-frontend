import assert from 'assert';
import { test } from 'node:test';
import axios from 'axios';
import Payment from '../models/Payment.js';
import { initiatePayment } from '../controllers/paymentController/paymentController.js';

function makeReq(body = {}, user = {}) {
  return { body, user };
}

function makeRes() {
  const res = {};
  res.statusCode = 200;
  res._body = null;
  res.status = function (code) { this.statusCode = code; return this; };
  res.json = function (obj) { this._body = obj; return this; };
  res.send = function (obj) { this._body = obj; return this; };
  return res;
}

test('initiatePayment - returns 400 on invalid amount', async () => {
  const req = makeReq({ amount: '-10', email: 'a@b.com', fullName: 'Test', courseId: 'cid' }, { _id: 'student1' });
  const res = makeRes();

  await initiatePayment(req, res);

  assert.strictEqual(res.statusCode, 400);
  assert.ok(res._body?.error?.toLowerCase().includes('invalid amount'));
});

test('initiatePayment - success returns checkoutUrl and tx_ref', async () => {
  // stub Payment.create and axios.post
  let created = false;
  const origCreate = Payment.create;
  const origAxiosPost = axios.post;

  Payment.create = async (obj) => { created = true; return { ...obj, _id: 'p1' }; };
  axios.post = async (url, payload, opts) => ({ data: { status: 'success', data: { checkout_url: 'https://checkout.test/abc' } } });

  // ensure env vars
  process.env.BACKEND_URL = process.env.BACKEND_URL || 'https://example.com';
  process.env.CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY || 'sk_test';
  process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'https://frontend.test';

  const req = makeReq({ amount: '100', email: 'a@b.com', fullName: 'Tester', courseId: 'cid' }, { _id: 'student1' });
  const res = makeRes();

  await initiatePayment(req, res);

  assert.strictEqual(res.statusCode, 200);
  assert.ok(res._body.checkoutUrl && res._body.tx_ref);
  assert.strictEqual(created, true);

  // restore
  Payment.create = origCreate;
  axios.post = origAxiosPost;
});

test('initiatePayment - axios error returns 500', async () => {
  const origCreate = Payment.create;
  const origAxiosPost = axios.post;

  Payment.create = async (obj) => ({ ...obj, _id: 'p2' });
  axios.post = async () => { throw new Error('Network error'); };

  process.env.BACKEND_URL = process.env.BACKEND_URL || 'https://example.com';
  process.env.CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY || 'sk_test';
  process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'https://frontend.test';

  const req = makeReq({ amount: '50', email: 'a@b.com', fullName: 'Tester', courseId: 'cid' }, { _id: 'student1' });
  const res = makeRes();

  await initiatePayment(req, res);

  assert.strictEqual(res.statusCode, 500);

  Payment.create = origCreate;
  axios.post = origAxiosPost;
});
