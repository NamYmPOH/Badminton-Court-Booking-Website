const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');

require.extensions['.ts'] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText,
  filename,
);

const { PaymentError } = require('../src/lib/payment-error.ts');

function createJpeg(size = 32) {
  const data = Buffer.alloc(size);
  data.set([0xff, 0xd8, 0xff, 0xe0]);
  data.set([0xff, 0xd9], size - 2);
  return data;
}

function createPng() {
  const data = Buffer.alloc(33);
  data.set([137, 80, 78, 71, 13, 10, 26, 10]);
  data.writeUInt32BE(13, 8);
  data.write('IHDR', 12);
  data.writeUInt32BE(1, 16);
  data.writeUInt32BE(1, 20);
  return data;
}

function setupTestEnvironment() {
  let submittedReview = null;
  const mockDb = {};

  const imports = {
    '@/lib/db': { db: mockDb },
    '@/lib/payment-session': {
      requirePaymentUser: async () => 'user-123',
    },
    '@/lib/admin-policy': {
      assertSameOrigin: () => {},
    },
    '@/lib/sepay': {
      PaymentError,
      paymentErrorResponse: (error) => {
        const status = error instanceof PaymentError ? error.status : 500;
        const message = error instanceof Error ? error.message : 'Lỗi hệ thống';
        return Response.json({ message }, { status });
      },
    },
    '@/lib/review-images': require('../src/lib/review-images.ts'),
    '@/services/review.service': {
      submitBookingReview: async (db, userId, code, input, now, photos) => {
        submittedReview = { db, userId, code, input, now, photos };
        return {
          id: 'review-new-999',
          rating: input.rating,
          comment: input.comment,
        };
      },
    },
  };

  const module = { exports: {} };
  const source = ts.transpileModule(
    fs.readFileSync('src/app/api/bookings/[code]/review/route.ts', 'utf8'),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    }
  ).outputText;

  new Function('require', 'module', 'exports', source)(
    (name) => imports[name] || require(name),
    module,
    module.exports
  );

  return {
    getSubmittedReview: () => submittedReview,
    handleRequest: (request, code = 'DATSAN9405970474') => module.exports.POST(request, { params: { code } }),
  };
}

test('POST /api/bookings/[code]/review: chấp nhận multipart/form-data có ảnh và lưu thành công', async () => {
  const env = setupTestEnvironment();
  const formData = new FormData();
  formData.append('rating', '5');
  formData.append('comment', 'Sân đẹp, nhân viên thân thiện. Trải nghiệm rất tốt.');

  const jpegBlob = new Blob([createJpeg()], { type: 'image/jpeg' });
  const pngBlob = new Blob([createPng()], { type: 'image/png' });
  formData.append('photos', jpegBlob, 'photo1.jpg');
  formData.append('photos', pngBlob, 'photo2.png');

  // Đóng gói request chuẩn Web API với FormData
  const dummyResponse = new Response(formData);
  const boundaryHeader = dummyResponse.headers.get('content-type');
  const bodyBuffer = await dummyResponse.arrayBuffer();

  const request = new Request('http://localhost/api/bookings/DATSAN9405970474/review', {
    method: 'POST',
    headers: {
      'content-type': boundaryHeader,
      'content-length': String(bodyBuffer.byteLength),
    },
    body: bodyBuffer,
  });

  const response = await env.handleRequest(request, 'DATSAN9405970474');
  assert.equal(response.status, 200);

  const json = await response.json();
  assert.equal(json.success, true);
  assert.equal(json.review.rating, 5);
  assert.equal(json.review.comment, 'Sân đẹp, nhân viên thân thiện. Trải nghiệm rất tốt.');

  const submitted = env.getSubmittedReview();
  assert.ok(submitted);
  assert.equal(submitted.userId, 'user-123');
  assert.equal(submitted.code, 'DATSAN9405970474');
  assert.equal(submitted.input.rating, 5);
  assert.equal(submitted.photos.length, 2);
  assert.equal(submitted.photos[0].mimeType, 'image/jpeg');
  assert.equal(submitted.photos[1].mimeType, 'image/png');
});

test('POST /api/bookings/[code]/review: chấp nhận multipart/form-data không kèm ảnh', async () => {
  const env = setupTestEnvironment();
  const formData = new FormData();
  formData.append('rating', '4');
  formData.append('comment', 'Chơi vui, sân thoáng.');

  const dummyResponse = new Response(formData);
  const boundaryHeader = dummyResponse.headers.get('content-type');
  const bodyBuffer = await dummyResponse.arrayBuffer();

  const request = new Request('http://localhost/api/bookings/DATSAN9405970474/review', {
    method: 'POST',
    headers: {
      'content-type': boundaryHeader,
    },
    body: bodyBuffer,
  });

  const response = await env.handleRequest(request, 'DATSAN9405970474');
  assert.equal(response.status, 200);

  const json = await response.json();
  assert.equal(json.success, true);
  assert.equal(json.review.rating, 4);

  const submitted = env.getSubmittedReview();
  assert.equal(submitted.photos.length, 0);
});

test('POST /api/bookings/[code]/review: chấp nhận application/json (từ modal đánh giá)', async () => {
  const env = setupTestEnvironment();
  const payload = JSON.stringify({ rating: 5, comment: 'Đánh giá từ modal' });

  const request = new Request('http://localhost/api/bookings/DATSAN9405970474/review', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: payload,
  });

  const response = await env.handleRequest(request, 'DATSAN9405970474');
  assert.equal(response.status, 200);

  const json = await response.json();
  assert.equal(json.success, true);
  assert.equal(json.review.rating, 5);
  assert.equal(json.review.comment, 'Đánh giá từ modal');

  const submitted = env.getSubmittedReview();
  assert.equal(submitted.photos.length, 0);
});

test('POST /api/bookings/[code]/review: từ chối Content-Type không hợp lệ với HTTP 415', async () => {
  const env = setupTestEnvironment();
  const request = new Request('http://localhost/api/bookings/DATSAN9405970474/review', {
    method: 'POST',
    headers: {
      'content-type': 'text/plain',
    },
    body: 'plain text content',
  });

  const response = await env.handleRequest(request);
  assert.equal(response.status, 415);
  const json = await response.json();
  assert.match(json.message, /Yêu cầu Content-Type application\/json hoặc multipart\/form-data/);
});

test('POST /api/bookings/[code]/review: từ chối payload vượt quá 4 MB với HTTP 413', async () => {
  const env = setupTestEnvironment();
  const oversizedData = Buffer.alloc(4 * 1024 * 1024 + 10);

  const request = new Request('http://localhost/api/bookings/DATSAN9405970474/review', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: oversizedData,
  });

  const response = await env.handleRequest(request);
  assert.equal(response.status, 413);
  const json = await response.json();
  assert.match(json.message, /vượt quá giới hạn 4 MB/);
});

