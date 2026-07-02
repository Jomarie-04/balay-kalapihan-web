import test from 'node:test';
import assert from 'node:assert/strict';
import { authenticate } from './middleware.js';

test('authenticate preserves full names from fallback bearer tokens', async () => {
  const req = {
    headers: {
      authorization: 'Bearer user-fallback-cancel-test::Cancel Test',
    },
  };

  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
    },
  };

  let nextCalled = false;
  authenticate(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.fullName, 'Cancel Test');
  assert.equal(req.username, 'cancel-test');
  assert.equal(req.isAdmin, false);
  assert.equal(res.statusCode, 200);
});
