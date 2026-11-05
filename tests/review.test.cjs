const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, filename);
const { submitBookingReview } = require('../src/services/review.service.ts');
const { hasFinishedPlaying } = require('../src/lib/review-policy.ts');
const { starFillPercent } = require('../src/lib/rating.ts');
const now = new Date('2026-11-05T06:00:00Z');
function fixture(options = {}) {
  let state = {
    reviews: [{ id: 'r1', bookingId: 'old1', venueId: 'v', rating: 5 }, { id: 'r2', bookingId: 'old2', venueId: 'v', rating: 4 }, { id: 'other', bookingId: 'other', venueId: 'elsewhere', rating: 1 }],
    images: [],
    venue: { ratingAvg: 4.5, ratingCount: 2 },
  };
  let queue = Promise.resolve();
  return {
    get state() { return state; },
    $transaction(fn) {
      const job = queue.then(async () => {
        const next = structuredClone(state);
        const tx = {
          user: { findUnique: async () => ({ status: options.userStatus || 'ACTIVE' }) },
          booking: { findFirst: async ({ where }) => {
            if (where.userId !== 'owner' || !['BOOK', 'BOOK2'].includes(where.code)) return null;
            const review = next.reviews.find(r => r.bookingId === where.code);
            return {
              id: where.code, venueId: 'v', status: options.status || 'COMPLETED', items: [{ date: new Date(options.date || '2026-11-05'), endMin: options.endMin || 600 }],
              review: review ? { ...review, images: next.images.filter(i => i.reviewId === review.id).sort((a, b) => a.position - b.position).map(i => ({ id: i.id, sha256: i.sha256 })) } : null,
            };
          } },
          review: {
            create: async ({ data }) => {
              const { images, ...fields } = data;
              const row = { id: `r${next.reviews.length + 1}`, ...fields };
              next.reviews.push(row);
              for (const image of images?.create || []) next.images.push({ id: `image-${next.images.length + 1}`, reviewId: row.id, ...image });
              return row;
            },
            aggregate: async ({ where }) => { const rows = next.reviews.filter(r => r.venueId === where.venueId); return { _avg: { rating: rows.reduce((sum, r) => sum + r.rating, 0) / rows.length }, _count: { _all: rows.length } }; },
          },
          venue: { update: async ({ data }) => { if (options.failUpdate) throw Error('storage failure'); next.venue = data; } },
        };
        const result = await fn(tx); state = next; return result;
      });
      queue = job.catch(() => {}); return job;
    },
  };
}
test('review after completed booking recalculates arithmetic mean of actual venue reviews', async () => {
  const db = fixture();
  await submitBookingReview(db, 'owner', 'BOOK', { rating: 1, comment: '  Cần cải thiện dịch vụ  ' }, now);
  assert.equal(db.state.venue.ratingAvg, 10 / 3);
  assert.equal(db.state.venue.ratingCount, 3);
  assert.equal(db.state.reviews.at(-1).comment, 'Cần cải thiện dịch vụ');
});
test('same request retried or submitted concurrently counts once', async () => {
  const db = fixture();
  await Promise.all([1, 2, 3].map(() => submitBookingReview(db, 'owner', 'BOOK', { rating: 5 }, now)));
  assert.equal(db.state.venue.ratingCount, 3);
  await assert.rejects(submitBookingReview(db, 'owner', 'BOOK', { rating: 1 }, now), e => e.status === 409);
});
test('concurrent reviews for two completed bookings preserve both contributions', async () => {
  const db = fixture();
  await Promise.all([submitBookingReview(db, 'owner', 'BOOK', { rating: 1 }, now), submitBookingReview(db, 'owner', 'BOOK2', { rating: 2 }, now)]);
  assert.equal(db.state.venue.ratingCount, 4);
  assert.equal(db.state.venue.ratingAvg, 3);
});
test('wrong owner and unknown booking rejected', async () => {
  const db = fixture();
  await assert.rejects(submitBookingReview(db, 'other', 'BOOK', { rating: 5 }, now), e => e.status === 404);
  await assert.rejects(submitBookingReview(db, 'owner', 'UNKNOWN', { rating: 5 }, now), e => e.status === 404);
  assert.equal(db.state.reviews.length, 3);
});
test('inactive account cannot review', async () => {
  await assert.rejects(submitBookingReview(fixture({ userStatus: 'BLOCKED' }), 'owner', 'BOOK', { rating: 5 }, now), e => e.status === 403);
});
test('only completed, finished bookings can be reviewed, including timezone boundary', async () => {
  for (const status of ['NO_SHOW', 'CANCELLED', 'EXPIRED', 'CONFIRMED', 'CHECKED_IN', 'PENDING_PAYMENT']) {
    await assert.rejects(submitBookingReview(fixture({ status }), 'owner', 'BOOK', { rating: 5 }, now), e => e.status === 409);
  }
  await assert.rejects(submitBookingReview(fixture({ date: '2026-11-06' }), 'owner', 'BOOK', { rating: 5 }, now), e => e.status === 409);
  const b = { status: 'COMPLETED', items: [{ date: '2026-11-05', endMin: 600 }] };
  assert.equal(hasFinishedPlaying(b, new Date('2026-11-05T02:59:59Z')), false);
  assert.equal(hasFinishedPlaying(b, new Date('2026-11-05T03:00:00Z')), true);
  assert.equal(hasFinishedPlaying({ ...b, items: [] }, now), false);
});
test('invalid rating, excessive comment and injected venue/user rejected', async () => {
  for (const input of [{ rating: 0 }, { rating: 6 }, { rating: 2.5 }, { rating: '5' }, { rating: 5, comment: 'a'.repeat(2001) }, { rating: 5, venueId: 'other' }, { rating: 5, userId: 'other' }]) {
    await assert.rejects(submitBookingReview(fixture(), 'owner', 'BOOK', input, now), e => e.status === 400);
  }
});
test('failure updating aggregate rolls back review creation', async () => {
  const db = fixture({ failUpdate: true });
  await assert.rejects(submitBookingReview(db, 'owner', 'BOOK', { rating: 5 }, now), /storage failure/);
  assert.equal(db.state.reviews.length, 3);
  assert.equal(db.state.venue.ratingCount, 2);
});
test('five star display supports fractional averages, zero and full rating', () => {
  const fills = rating => Array.from({ length: 5 }, (_, i) => starFillPercent(rating, i));
  assert.deepEqual(fills(0), [0, 0, 0, 0, 0]);
  assert.deepEqual(fills(5), [100, 100, 100, 100, 100]);
  assert.ok(Math.abs(fills(4.3)[4] - 30) < 0.00001);
  assert.deepEqual(fills(NaN), [0, 0, 0, 0, 0]);
});

function reviewPhoto(value = 0) {
  const data = Buffer.from([0xff, 0xd8, 0xff, 0xe0, value, 0, 0xff, 0xd9]);
  return { data, mimeType: 'image/jpeg' };
}

test('review images persist as related rows in original order with the completed booking review', async () => {
  const db = fixture();
  const photos = [reviewPhoto(1), reviewPhoto(2)];
  const review = await submitBookingReview(db, 'owner', 'BOOK', { rating: 4, comment: 'Buổi chơi có ảnh kèm theo' }, now, photos);
  assert.equal(db.state.reviews.length, 4);
  assert.equal(db.state.images.length, 2);
  assert.equal(db.state.venue.ratingCount, 3);
  assert.equal(db.state.venue.ratingAvg, 13 / 3);
  assert.equal(Object.hasOwn(db.state.reviews.at(-1), 'images'), false, 'nested create is input, not a scalar database value');
  for (let index = 0; index < photos.length; index++) {
    const image = db.state.images[index];
    assert.equal(image.reviewId, review.id);
    assert.equal(image.position, index);
    assert.equal(image.mimeType, photos[index].mimeType);
    assert.equal(typeof image.sha256, 'string');
    assert.equal(image.sha256.length, 64);
    assert.deepEqual(Buffer.from(image.data), photos[index].data);
  }
});

test('same review and photos retried concurrently create only one review and one set of photos', async () => {
  const db = fixture();
  const attempts = await Promise.all([1, 2, 3].map(() => submitBookingReview(db, 'owner', 'BOOK', { rating: 5, comment: 'Ảnh buổi tập' }, now, [reviewPhoto(1), reviewPhoto(2)])));
  assert.equal(new Set(attempts.map(r => r.id)).size, 1);
  assert.equal(db.state.reviews.filter(r => r.bookingId === 'BOOK').length, 1);
  assert.equal(db.state.images.length, 2);
  assert.equal(db.state.venue.ratingCount, 3);
});

test('different, removed, added or reordered photos cannot overwrite an existing review', async () => {
  const db = fixture();
  const input = { rating: 4, comment: 'Giữ nguyên bộ ảnh đã gửi' };
  await submitBookingReview(db, 'owner', 'BOOK', input, now, [reviewPhoto(1), reviewPhoto(2)]);
  const hashes = db.state.images.map(i => i.sha256);
  for (const photos of [[], [reviewPhoto(1)], [reviewPhoto(1), reviewPhoto(3)], [reviewPhoto(2), reviewPhoto(1)], [reviewPhoto(1), reviewPhoto(2), reviewPhoto(3)]]) {
    await assert.rejects(submitBookingReview(db, 'owner', 'BOOK', input, now, photos), e => e.status === 409);
  }
  assert.equal(db.state.images.length, 2);
  assert.deepEqual(db.state.images.map(i => i.sha256), hashes);
  assert.equal(db.state.venue.ratingCount, 3);
});

test('failure updating rating rolls back nested review images and review together', async () => {
  const db = fixture({ failUpdate: true });
  await assert.rejects(submitBookingReview(db, 'owner', 'BOOK', { rating: 5 }, now, [reviewPhoto(1), reviewPhoto(2)]), /storage failure/);
  assert.equal(db.state.images.length, 0);
  assert.equal(db.state.reviews.length, 3);
  assert.deepEqual(db.state.venue, { ratingAvg: 4.5, ratingCount: 2 });
});

test('unauthorized and ineligible requests never persist review photo bytes', async () => {
  for (const [options, userId, expected] of [[{}, 'other', 404], [{ userStatus: 'BLOCKED' }, 'owner', 403], [{ status: 'CANCELLED' }, 'owner', 409], [{ date: '2026-11-06' }, 'owner', 409]]) {
    const db = fixture(options);
    await assert.rejects(submitBookingReview(db, userId, 'BOOK', { rating: 5 }, now, [reviewPhoto(1)]), e => e.status === expected);
    assert.equal(db.state.images.length, 0);
    assert.equal(db.state.reviews.length, 3);
    assert.equal(db.state.venue.ratingCount, 2);
  }
});
