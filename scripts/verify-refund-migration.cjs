const fs = require('node:fs');
const assert = require('node:assert/strict');
const { PGlite } = require('../node_modules/.refund-validation/node_modules/@electric-sql/pglite');
(async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      CREATE ROLE anon; CREATE ROLE authenticated;
      CREATE TABLE "GroupRefund" ("id" text PRIMARY KEY, "paymentId" text UNIQUE, "amount" integer NOT NULL, "status" text NOT NULL DEFAULT 'PENDING', "reference" text, CONSTRAINT "GroupRefund_valid_status" CHECK (status IN ('PENDING', 'COMPLETED')));
      CREATE TABLE "GroupShare" ("id" text PRIMARY KEY, "amount" integer NOT NULL CHECK (amount > 0));
      ALTER TABLE "GroupShare" DROP CONSTRAINT "GroupShare_amount_check";
      ALTER TABLE "GroupShare" ADD CONSTRAINT "GroupShare_positive_amount" CHECK (amount > 0);
      INSERT INTO "GroupRefund" VALUES ('legacy', 'p0', 200000, 'COMPLETED', 'OLD-BANK-1'), ('pending', 'p1', 100000, 'PENDING', null);
    `);
    const sql = fs.readFileSync('prisma/patches/20261029_refund_ledger.sql', 'utf8');
    assert.equal(sql, fs.readFileSync('supabase/migrations/20261028191729_refund_ledger.sql', 'utf8'));
    await db.exec(sql);
    await db.exec(sql);
    const legacy = (await db.query(`SELECT status, "completedAmount" FROM "GroupRefund" WHERE id = 'legacy'`)).rows[0];
    assert.deepEqual(legacy, { status: 'REVIEW_REQUIRED', completedAmount: 0 });
    await db.exec(`INSERT INTO "GroupShare" VALUES ('zero-share', 0)`);
    const reject = async (sql, code) => assert.rejects(db.exec(sql), (e) => e.code === code);
    await reject(`INSERT INTO "GroupShare" VALUES ('negative', -1)`, '23514');
    await reject(`UPDATE "GroupRefund" SET "completedAmount" = 100001 WHERE id = 'pending'`, '23514');
    await reject(`INSERT INTO "RefundDisbursement" VALUES ('d0', 'BANK-000', 'missing', 1, 'staff', now())`, '23503');
    await reject(`INSERT INTO "RefundDisbursement" VALUES ('d0', 'BANK-000', 'pending', 0, 'staff', now())`, '23514');
    await reject(`INSERT INTO "RefundDisbursement" VALUES ('d0', ' bank-000 ', 'pending', 1, 'staff', now())`, '23514');
    await db.exec(`INSERT INTO "RefundDisbursement" VALUES ('d1', 'BANK-001', 'pending', 30000, 'staff', now())`);
    await reject(`INSERT INTO "RefundDisbursement" VALUES ('d2', 'BANK-001', 'legacy', 30000, 'staff', now())`, '23505');
    await db.exec(`UPDATE "GroupRefund" SET "completedAmount" = 30000 WHERE id = 'pending'`);
    const rls = (await db.query(`SELECT relrowsecurity FROM pg_class WHERE oid = '"RefundDisbursement"'::regclass`)).rows[0];
    assert.equal(rls.relrowsecurity, true);
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`SET ROLE ${role}`);
      for (const sql of [
        `SELECT * FROM "RefundDisbursement"`,
        `INSERT INTO "RefundDisbursement" VALUES ('attack', 'ATTACK-1', 'pending', 1, 'staff', now())`,
        `UPDATE "RefundDisbursement" SET amount = 1`,
        `DELETE FROM "RefundDisbursement"`,
      ]) await reject(sql, '42501');
      await db.exec('RESET ROLE');
    }
    console.log('PASS: PostgreSQL WASM migration twice, legacy review, zero shares, amount bounds, FK, unique reference, normalized reference, RLS and 8 access denials.');
  } finally { await db.close(); }
})().catch((e) => { console.error(e.message); process.exitCode = 1; });
