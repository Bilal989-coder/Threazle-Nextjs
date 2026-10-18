process.env.NEXT_PUBLIC_RELEASE_PHASE = '2';
/* Offline tests of the actual source utilities and HTTP adapter. No database is modified. */
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
process.env.NEXT_PUBLIC_DATA_MODE = 'api';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:4000/api/v1';
process.env.NEXT_PUBLIC_IMAGE_HOSTS = 'media.example.com';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (id, parent, ...rest) {
    if (id.startsWith('@/'))
        id = path.join(root, 'src', id.slice(2));
    return originalResolve.call(this, id, parent, ...rest);
};
require.extensions['.ts'] = function (module, filename) {
    const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, resolveJsonModule: true },
    });
    module._compile(result.outputText, filename);
};
const commerce = require('../src/lib/commerce.ts');
const attempts = require('../src/lib/checkout-attempt.ts');
const config = require('../src/lib/config.ts');
const http = require('../src/api/client.ts');
const demo = require('../tests/fixtures/demo.ts');
const tests = [];
const test = (name, run) => tests.push({ name, run });
const line = (changes = {}) => ({ id: 'line-1', productId: 'p-1', productSlug: 'ivory-sherwani', productName: 'Ivory Sherwani', productImage: '/images/test.webp', categoryId: 'cat-1', mode: 'ready_made', sizeLabel: 'M', quantity: 1, maxQuantity: 4, unitPrice: 1000, leadTimeDays: { min: 7, max: 10 }, ...changes });
const custom = (values = { chest: 40 }, changes = {}) => line({ mode: 'stitch', sizeLabel: undefined, customization: { variantId: 'style-1', fabricId: 'fabric-1', measurementProfileId: 'profile-1', measurementProfileName: 'Self', measurementSnapshot: values, addonIds: ['addon-1'], notes: 'A personal detail' }, ...changes });
const fakeResponse = (data, status = 200) => new Response(JSON.stringify({ success: true, data }), { status, headers: { 'Content-Type': 'application/json' } });
test('Source custom snapshot is copied; later profile changes cannot mutate it', () => {
    const original = custom();
    const body = commerce.orderLine(original);
    original.customization.measurementSnapshot.chest = 44;
    assert.equal(body.measurementSnapshot.chest, 40);
});
test('Order payload omits live measurementProfileId intentionally', () => { const body = commerce.orderLine(custom()); assert.equal('measurementProfileId' in body, false); });
test('Order payload has no browser price or unrelated internal fields', () => {
    const body = commerce.orderLine(line());
    assert.deepEqual(Object.keys(body).sort(), ['mode', 'productId', 'quantity', 'sizeLabel'].sort());
});
test('Ready-made quote uses sizeLabel, not style variant', () => { assert.deepEqual(commerce.quoteInput(line()), { productId: 'p-1', mode: 'ready_made', sizeLabel: 'M' }); });
test('Custom quote uses backend buying mode stitch and actual option IDs', () => { assert.deepEqual(commerce.quoteInput(custom()), { productId: 'p-1', mode: 'stitch', variantId: 'style-1', fabricId: 'fabric-1', addonIds: ['addon-1'] }); });
test('Distinct measurement sets stay in distinct cart lines', () => { assert.equal(commerce.mergeCart([custom()], custom({ chest: 42 }, { id: 'line-2' })).length, 2); });
test('Identical configurations merge and keep original line ID', () => { const result = commerce.mergeCart([custom()], custom({ chest: 40 }, { id: 'line-2' })); assert.equal(result.length, 1); assert.equal(result[0].quantity, 2); assert.equal(result[0].id, 'line-1'); });
test('Display profile labels do not create duplicate configurations', () => { const a = custom(), b = custom(); b.customization.measurementProfileName = 'Renamed'; assert.equal(commerce.cartKey(a), commerce.cartKey(b)); });
test('Editing replaces the existing line rather than adding its quantity twice', () => { const result = commerce.mergeCart([line()], line({ quantity: 3 }), 'line-1'); assert.equal(result[0].quantity, 3); });
test('Ready-made merged quantity cannot exceed available stock', () => { assert.throws(() => commerce.mergeCart([line({ quantity: 4 })], line()), /Only 4/); });
test('Quantity zero is rejected', () => assert.throws(() => commerce.mergeCart([], line({ quantity: 0 }))));
test('Fractional garment quantity is rejected', () => assert.throws(() => commerce.mergeCart([], line({ quantity: 1.5 }))));
test('Quantity above backend maximum is rejected', () => assert.throws(() => commerce.mergeCart([], custom({}, { quantity: 51 }))));
test('More than 30 distinct lines are rejected', () => { const items = Array.from({ length: 30 }, (_, i) => line({ id: `line${i}`, productId: `p${i}` })); assert.throws(() => commerce.mergeCart(items, line({ productId: 'new' })), /30/); });
test('Merged custom data is a separate snapshot', () => { const a = custom(), result = commerce.mergeCart([], a); a.customization.measurementSnapshot.chest = 45; assert.equal(result[0].customization.measurementSnapshot.chest, 40); });
test('Tab storage rejects malformed JSON', () => assert.deepEqual(commerce.restoreCart('{bad'), []));
test('Tab storage rejects impossible quantities', () => assert.deepEqual(commerce.restoreCart(JSON.stringify([line({ quantity: -1 })])), []));
test('Tab storage rejects missing structured custom fields', () => assert.deepEqual(commerce.restoreCart(JSON.stringify([custom({}, { customization: {} })])), []));
test('Tab storage deduplicates line IDs', () => assert.equal(commerce.restoreCart(JSON.stringify([line(), line()])).length, 1));
test('Tab storage accepts a complete valid ready-made line', () => assert.equal(commerce.restoreCart(JSON.stringify([line()])).length, 1));
test('Tab storage rejects oversized input', () => assert.deepEqual(commerce.restoreCart(' '.repeat(150001)), []));
test('Tab storage rejects invalid numeric custom values', () => assert.deepEqual(commerce.restoreCart(JSON.stringify([custom({ chest: -2 })])), []));
test('Standard shipping below the source threshold is Rs.250', () => assert.equal(commerce.shipping(9999, 'standard'), 250));
test('Standard shipping at the source threshold is free', () => assert.equal(commerce.shipping(10000, 'standard'), 0));
test('Express shipping follows the source Rs.500 constant', () => assert.equal(commerce.shipping(10000, 'express'), 500));
test('Shipping threshold uses net merchandise after discounts', () => { const t = commerce.previewTotals([line({ unitPrice: 10000 })], 'standard', 1, 0); assert.equal(t.shipping, 250); assert.equal(t.total, 10249); });
test('Combined coupon and loyalty cannot exceed subtotal', () => assert.throws(() => commerce.previewTotals([line()], 'standard', 800, 300), /exceed/));
test('NaN monetary input cannot produce a displayed valid total', () => assert.throws(() => commerce.previewTotals([line()], 'standard', NaN, 0)));
test('Totals use two-decimal rounding', () => assert.equal(commerce.subtotal([line({ unitPrice: 10.15, quantity: 3 })]), 30.45));
test('Valid decimal measurements pass configured ranges', () => assert.deepEqual(commerce.validateMeasurements({ neck: 15.5 }, [{ key: 'neck', label: 'Neck', unit: 'in', min: 10, max: 25 }]), {}));
test('Missing measurements are rejected', () => assert.ok(commerce.validateMeasurements({}, [{ key: 'chest', label: 'Chest', unit: 'in' }]).chest));
test('Values below configured minimum are rejected', () => assert.ok(commerce.validateMeasurements({ neck: 1 }, [{ key: 'neck', label: 'Neck', unit: 'in', min: 10 }]).neck));
test('Values above configured maximum are rejected', () => assert.ok(commerce.validateMeasurements({ neck: 50 }, [{ key: 'neck', label: 'Neck', unit: 'in', max: 25 }]).neck));
test('Unknown measurement fields are rejected', () => assert.ok(commerce.validateMeasurements({ admin: 1 }, []).admin));
test('Stable fingerprints ignore object key ordering', async () => assert.equal(await commerce.fingerprint({ b: 2, a: 1 }), await commerce.fingerprint({ a: 1, b: 2 })));
test('Different checkout addresses produce different fingerprints', async () => assert.notEqual(await commerce.fingerprint({ city: 'Karachi' }), await commerce.fingerprint({ city: 'Lahore' })));
test('An uncertain retry reuses the exact submission key', () => { const old = { key: 'old', hash: 'same', owner: 'guest', state: 'pending', createdAt: 1 }; assert.equal(attempts.resolveAttempt(old, 'same', 'guest', 'new', 2).key, 'old'); });
test('A changed request cannot reuse an unresolved checkout attempt', () => assert.throws(() => attempts.resolveAttempt({ key: 'old', hash: 'a', owner: 'guest', state: 'pending', createdAt: 1 }, 'b', 'guest', 'new', 2)));
test('Changing account cannot bypass an unresolved checkout attempt', () => assert.throws(() => attempts.resolveAttempt({ key: 'old', hash: 'a', owner: 'customer1', state: 'pending', createdAt: 1 }, 'a', 'customer2', 'new', 2)));
test('A completed order permits a new checkout key', () => assert.equal(attempts.resolveAttempt({ key: 'old', hash: 'a', owner: 'guest', state: 'complete', createdAt: 1 }, 'a', 'guest', 'new', 2).key, 'new'));
test('Corrupt retry storage is ignored safely', () => assert.equal(attempts.readAttempt({ getItem: () => '{bad' }), null));
test('Internal redirect preserves intended checkout route', () => assert.equal(config.safeInternalPath('/checkout?step=1'), '/checkout?step=1'));
test('Protocol-relative open redirect is rejected', () => assert.equal(config.safeInternalPath('//evil.example'), '/account'));
test('External redirect is rejected', () => assert.equal(config.safeInternalPath('https://evil.example'), '/account'));
test('Backslash redirect is rejected', () => assert.equal(config.safeInternalPath('/\\evil.example'), '/account'));
test('Unapproved remote product media is not fetched', () => assert.equal(config.safeImageSource('https://untrusted.example/photo.jpg'), '/images/placeholder.svg'));
test('Configured media hostname is accepted', () => assert.equal(config.safeImageSource('https://media.example.com/photo.jpg'), 'https://media.example.com/photo.jpg'));
test('Supabase storage hostname is accepted', () => assert.equal(config.safeImageSource('https://example.supabase.co/storage/photo.webp'), 'https://example.supabase.co/storage/photo.webp'));
test('Media credentials or HTTP are rejected', () => { assert.equal(config.safeImageSource('https://name:password@media.example.com/x'), '/images/placeholder.svg'); assert.equal(config.safeImageSource('http://media.example.com/x'), '/images/placeholder.svg'); });
test('Local WebP path is accepted', () => assert.equal(config.safeImageSource('/images/products/photo.webp'), '/images/products/photo.webp'));
test('API array filters use repeated query keys', () => { const u = new URL(http.buildApiUrl('/products', { fabricTypes: ['Cotton', 'Jamawar'], page: 2, unused: undefined })); assert.deepEqual(u.searchParams.getAll('fabricTypes'), ['Cotton', 'Jamawar']); assert.equal(u.searchParams.get('page'), '2'); assert.equal(u.searchParams.has('unused'), false); });
test('API false booleans remain false query values', () => assert.match(http.buildApiUrl('/products', { onSaleOnly: false }), /onSaleOnly=false/));
test('Protocol-relative API path is rejected', () => assert.throws(() => http.buildApiUrl('//evil.example')));
test('API unwraps supplied success envelope', async () => { global.fetch = async () => fakeResponse({ id: 'p1' }); assert.deepEqual(await http.request('/products/slug/test'), { id: 'p1' }); });
test('API handles 204 deletes without parsing JSON', async () => { global.fetch = async () => new Response(null, { status: 204 }); assert.equal(await http.request('/test', { method: 'DELETE' }), undefined); });
test('API exposes backend validation message and code', async () => { global.fetch = async () => new Response(JSON.stringify({ success: false, error: { message: 'Size unavailable', code: 'SIZE_UNAVAILABLE', fieldErrors: { sizeLabel: 'Choose a size' } } }), { status: 400 }); await assert.rejects(() => http.request('/products/compute-price'), e => e instanceof http.ApiError && e.status === 400 && e.code === 'SIZE_UNAVAILABLE'); });
test('API does not fall back to sample products on a network error', async () => { global.fetch = async () => { throw new Error('offline'); }; await assert.rejects(() => http.request('/products'), e => e instanceof http.ApiError && e.status === 0); });
test('API rejects unexpected non-envelope success responses', async () => { global.fetch = async () => new Response(JSON.stringify({ items: [] }), { status: 200 }); await assert.rejects(() => http.request('/products'), e => e.code === 'INVALID_RESPONSE'); });
test('Authenticated requests cannot silently run on the anonymous server client', async () => { let called = false; global.fetch = async () => { called = true; return fakeResponse({}); }; await assert.rejects(() => http.request('/customers/me', { authenticated: true }), e => e.code === 'SESSION_REQUIRED'); assert.equal(called, false); });
test('Mutation adapter sends one request with the exact body, no automatic retry', async () => { let count = 0; global.fetch = async (url, options) => { count++; assert.equal(options.method, 'POST'); assert.equal(JSON.parse(options.body).idempotencyKey, 'one-key'); return fakeResponse({ id: 'o1' }); }; await http.request('/orders', { method: 'POST', body: { idempotencyKey: 'one-key' } }); assert.equal(count, 1); });
test('Price request uses exact /products/compute-price contract', async () => { const catalog = require('../src/api/catalog.ts'); global.fetch = async (url, options) => { assert.match(url, /\/api\/v1\/products\/compute-price$/); assert.deepEqual(JSON.parse(options.body), { productId: 'id1', mode: 'ready_made', sizeLabel: 'M' }); return fakeResponse({ total: 1500, breakdown: [] }); }; assert.equal((await catalog.computePrice({ productId: 'id1', mode: 'ready_made', sizeLabel: 'M' })).total, 1500); });
test('Order adapter retains the actual server-generated ID', async () => { const api = require('../src/api/orders.ts'); global.fetch = async () => fakeResponse({ order: { id: 'server-order-id' }, pointsEarned: 0 }, 201); const result = await api.createOrder({ items: [commerce.orderLine(line())], idempotencyKey: 'same-key' }, false); assert.equal(result.order.id, 'server-order-id'); });
test('Sample catalog has distinct stable slugs', () => { assert.equal(new Set(demo.demoData.products.map(p => p.slug)).size, demo.demoData.products.length); });
test('All sample products reference existing categories', () => { assert.ok(demo.demoData.products.every(p => demo.demoData.categories.some(c => c.id === p.categoryId))); });
test('Sample category filter changes the dataset', () => { const c = demo.demoData.categories[0]; assert.ok(demo.demoList({ categorySlug: c.slug }).items.every(p => p.categoryId === c.id)); });
test('Sample impossible search returns zero instead of fake constant results', () => assert.equal(demo.demoList({ search: 'no such garment xyz123' }).total, 0));
(async () => {
    let passed = 0;
    const results = [];
    for (const { name, run } of tests) {
        try {
            await run();
            passed++;
            results.push({ name, status: 'passed' });
            console.log(`PASS ${name}`);
        }
        catch (error) {
            results.push({ name, status: 'failed', message: error.message });
            console.error(`FAIL ${name}\n${error.stack}`);
        }
    }
    const report = { suite: 'Offline source utility and API-adapter tests', total: tests.length, passed, failed: tests.length - passed, results };
    const out = path.join(root, 'test-results');
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, 'core-results.json'), JSON.stringify(report, null, 2));
    console.log(`\n${passed}/${tests.length} checks passed. These do not replace a Next.js build, browser tests or live-backend tests.`);
    process.exitCode = passed === tests.length ? 0 : 1;
})();
