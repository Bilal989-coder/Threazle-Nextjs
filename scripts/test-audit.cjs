process.env.NEXT_PUBLIC_RELEASE_PHASE = '2';
/* v2.3 regression tests for source helpers and mocked HTTP boundaries.
 * These run without Next/React/browser execution and never contact a real backend.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
process.env.NEXT_PUBLIC_DATA_MODE = 'api';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:4000/api/v1';
process.env.NEXT_PUBLIC_ENABLE_INDEXING = 'false';
const resolve = Module._resolveFilename;
Module._resolveFilename = function (id, parent, ...args) {
    return resolve.call(this, id.startsWith('@/') ? path.join(root, 'src', id.slice(2)) : id, parent, ...args);
};
require.extensions['.ts'] = function (module, filename) {
    module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        fileName: filename,
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, resolveJsonModule: true },
    }).outputText, filename);
};
const navigation = require('../src/lib/navigation.ts');
const presentation = require('../src/lib/catalog-presentation.ts');
const measurement = require('../src/lib/measurement-guide.ts');
const validation = require('../src/lib/checkout-validation.ts');
const { lockDialogScroll } = require('../src/lib/dialog-scroll.ts');
const catalog = require('../src/api/catalog.ts');
const http = require('../src/api/client.ts');
const { demoData, demoList } = require('../tests/fixtures/demo.ts');
const { repriceCart } = require('../src/services/reprice.ts');
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const response = (data, status = 200) => new Response(JSON.stringify({ success: status < 400, data }), { status, headers: { 'Content-Type': 'application/json' } });
const product = demoData.products[0];
const address = { fullName: 'Test Customer', line1: '1 Example Street', city: 'Karachi', postalCode: '75500', phone: '+92 300 1234567' };
const category = (id, parentId = null, sortOrder = 0) => ({ ...demoData.categories[0], id, parentId, sortOrder, name: id, slug: id.toLowerCase() });

test('Navigation uses all configured root collections', () => assert.equal(navigation.navigationCollections(demoData.categories).length, 5));
test('A child is nested once instead of duplicated as a top-level collection', () => {
    const result = navigation.navigationCollections([category('A'), category('B', 'A')]);
    assert.equal(result.length, 1); assert.deepEqual(result[0].children.map(c => c.id), ['B']);
});
test('A temporarily missing parent does not make a collection unreachable', () => assert.equal(navigation.navigationCollections([category('Orphan', 'missing')])[0].category.id, 'Orphan'));
test('Menu ordering follows category sortOrder', () => assert.deepEqual(navigation.navigationCollections([category('B', null, 2), category('A', null, 1)]).map(c => c.category.id), ['A', 'B']));
test('Duplicate category IDs do not produce duplicate menu rows', () => assert.equal(navigation.navigationCollections([category('A'), category('A')]).length, 1));
test('Large bag badges are capped without modifying the underlying quantity', () => assert.equal(navigation.badgeCount(152), '99+'));
test('Invalid and negative badge values do not show NaN or negative counts', () => { assert.equal(navigation.badgeCount(NaN), '0'); assert.equal(navigation.badgeCount(-1), '0'); });
test('Blank searches cannot navigate to a misleading empty search', () => assert.equal(navigation.searchHref('   '), null));
test('Search encodes special characters and trims surrounding whitespace', () => assert.equal(navigation.searchHref('  silk & wool  '), '/search?q=silk%20%26%20wool'));
test('Search limits match the existing 150-character catalog contract', () => assert.equal(new URL(navigation.searchHref('x'.repeat(300)), 'https://example.invalid').searchParams.get('q').length, 150));
test('The fifth CMS banner is reachable rather than forced into a three-slide loop', () => assert.equal(presentation.carouselPosition(4, presentation.carouselLength(5, 3)), 4));
test('The carousel wraps correctly in both directions', () => { assert.equal(presentation.carouselPosition(-1, 5), 4); assert.equal(presentation.carouselPosition(5, 5), 0); });
test('Fallback hero count comes from the fallback content', () => assert.equal(presentation.carouselLength(0, 3), 3));
test('One slide does not divide by zero or produce an invalid position', () => assert.equal(presentation.carouselPosition(5, 0), 0));
test('Page numbers are whole numbers before reaching the backend', () => assert.equal(presentation.pageNumber('2.9'), 2));
test('Invalid, negative and excessive page values are bounded', () => { assert.equal(presentation.pageNumber('abc'), 1); assert.equal(presentation.pageNumber('-8'), 1); assert.equal(presentation.pageNumber('1e9'), 10000); });
test('Admin-selected primary photo is first, with other gallery images stable', () => {
    const p = { ...product, images: [{ id: 'a', url: 'a' }, { id: 'b', url: 'b', isPrimary: true }, { id: 'c', url: 'c' }] };
    assert.deepEqual(presentation.normalizeProduct(p).images.map(i => i.id), ['b', 'a', 'c']);
    assert.deepEqual(p.images.map(i => i.id), ['a', 'b', 'c']);
});
test('A catalog with no primary flag preserves original gallery order', () => assert.deepEqual(presentation.normalizeProduct(product).images.map(i => i.id), product.images.map(i => i.id)));
test('Empty image lists still normalize without an invented photograph', () => assert.deepEqual(presentation.normalizeProduct({ ...product, images: [] }).images, []));
test('Waistcoat length is not confused with waist circumference', () => assert.equal(measurement.measureHelp('waistcoat_length'), measurement.measureHelp('length')));
test('Trouser waist is not confused with trouser length', () => assert.equal(measurement.measureHelp('trouser_waist'), measurement.measureHelp('waist')));
test('Trouser length and inner-leg length receive their different instructions', () => { assert.equal(measurement.measureHelp('trouser_length'), measurement.measureHelp('trouser')); assert.equal(measurement.measureHelp('inside_leg_length'), measurement.measureHelp('inseam')); });
test('Snake-case and camel-case sleeve names find the same guidance', () => assert.equal(measurement.measureHelp('sleeve_length'), measurement.measureHelp('sleeveLength')));
test('A recognized field key wins over a contradictory display label', () => assert.equal(measurement.measureHelp('sleeve_length', 'Chest'), measurement.measureHelp('sleeve')));
test('An unknown measurement does not receive an invented instruction', () => assert.equal(measurement.measureHelp('unknown_field', 'Other'), undefined));
test('Valid delivery contact fields are accepted', () => assert.equal(validation.validDeliveryAddress(address), true));
test('A punctuation-only phone cannot pass as a delivery number', () => assert.equal(validation.validDeliveryAddress({ ...address, phone: '----------' }), false));
test('A misplaced plus sign is rejected in a phone', () => assert.equal(validation.validDeliveryAddress({ ...address, phone: '0300+1234567' }), false));
test('A country code with spaces or hyphens remains valid', () => assert.equal(validation.validDeliveryAddress({ ...address, phone: '+92-300-1234567' }), true));
test('Whitespace-only recipient names are rejected', () => assert.equal(validation.validDeliveryAddress({ ...address, fullName: '  ' }), false));
test('Invalid postal codes cannot reach order creation', () => assert.equal(validation.validDeliveryAddress({ ...address, postalCode: 'ZIP' }), false));
test('Checkout email validates the whole address instead of only finding @', () => { assert.equal(validation.validCheckoutEmail('person@example.com'), true); assert.equal(validation.validCheckoutEmail('person@'), false); assert.equal(validation.validCheckoutEmail('person @example.com'), false); });
test('Closing one of two dialogs leaves document scrolling locked', () => {
    const document = { body: { style: { overflow: 'auto' } } };
    const first = lockDialogScroll(document), second = lockDialogScroll(document);
    first(); assert.equal(document.body.style.overflow, 'hidden');
    second(); assert.equal(document.body.style.overflow, 'auto');
});
test('Double cleanup of the same dialog does not release another dialog lock', () => {
    const document = { body: { style: { overflow: '' } } };
    const first = lockDialogScroll(document), second = lockDialogScroll(document);
    first(); first(); assert.equal(document.body.style.overflow, 'hidden'); second(); assert.equal(document.body.style.overflow, '');
});
test('Dialog locks are isolated between documents', () => {
    const a = { body: { style: { overflow: 'auto' } } }, b = { body: { style: { overflow: 'scroll' } } };
    const x = lockDialogScroll(a), y = lockDialogScroll(b); x(); assert.equal(b.body.style.overflow, 'hidden'); y(); assert.equal(b.body.style.overflow, 'scroll');
});
test('Fabric 404 responses become a real missing-resource result', async () => { global.fetch = async () => response(null, 404); assert.equal(await catalog.getFabric('missing'), null); });
test('Fabric service errors are not disguised as missing products', async () => { global.fetch = async () => response(null, 503); await assert.rejects(() => catalog.getFabric('fabric'), e => e.status === 503); });
test('Published CMS content is retained', async () => { global.fetch = async () => response({ slug: 'about', status: 'published', content: '<p>Approved copy</p>' }); assert.equal((await catalog.getPage('about')).slug, 'about'); });
test('Draft CMS content is never displayed even if returned by an endpoint', async () => { global.fetch = async () => response({ slug: 'about', status: 'draft', content: 'not approved' }); assert.equal(await catalog.getPage('about'), null); });
test('CMS 404 is a missing page, not an unhandled error', async () => { global.fetch = async () => response(null, 404); assert.equal(await catalog.getPage('missing'), null); });
test('New-arrival API requests retain the supported isNew filter', async () => {
    global.fetch = async url => { assert.equal(new URL(url).searchParams.get('isNew'), 'true'); return response({ items: [], total: 0, totalPages: 1, page: 1, pageSize: 12 }); };
    await catalog.getProducts({ isNew: true });
});
test('Preview new arrivals are a subset, not the full collection under another heading', () => {
    const all = demoList({ pageSize: 100 }), fresh = demoList({ isNew: true, pageSize: 100 });
    assert.ok(fresh.total > 0 && fresh.total < all.total); assert.ok(fresh.items.every(p => p.isNew));
});
test('Product API responses honor their primary image flag', async () => {
    global.fetch = async () => response({ ...product, images: [{ id: 'a', url: 'a' }, { id: 'b', url: 'b', isPrimary: true }] });
    assert.equal((await catalog.getProduct(product.slug)).images[0].id, 'b');
});
test('A read timeout does not incorrectly claim an order might have been placed', async () => {
    global.fetch = (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }));
    await assert.rejects(() => http.request('/products', { timeoutMs: 5 }), e => e.code === 'TIMEOUT' && !e.message.includes('order may'));
});
test('An order timeout preserves the warning about uncertain order submission', async () => {
    global.fetch = (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }));
    await assert.rejects(() => http.request('/orders', { method: 'POST', timeoutMs: 5 }), e => e.code === 'TIMEOUT' && e.message.includes('order may'));
});
test('Custom checkout is blocked when the category measurement definition is missing', async () => {
    global.fetch = async url => response(new URL(url).pathname.endsWith('/categories') ? [{ ...demoData.categories.find(c => c.id === product.categoryId), measurementFields: [] }] : product);
    const item = { id: 'cart-id', productId: product.id, productSlug: product.slug, productName: product.name, categoryId: product.categoryId, mode: 'stitch', quantity: 1, unitPrice: product.basePrice,
        customization: { variantId: product.variants[0]?.id, fabricId: product.compatibleFabricIds[0], addonIds: [], measurementSnapshot: { chest: 40 } } };
    await assert.rejects(() => repriceCart([item]), /Measurement guidance/);
});
(async () => {
    const results = [];
    for (const { name, fn } of tests) {
        try { await fn(); results.push({ name, status: 'passed' }); console.log(`PASS ${name}`); }
        catch (e) { results.push({ name, status: 'failed', message: e.message }); console.error(`FAIL ${name}\n${e.stack}`); }
    }
    const report = { suite: 'v2.3 source regressions and mocked API boundaries', total: results.length, passed: results.filter(r => r.status === 'passed').length, failed: results.filter(r => r.status === 'failed').length, results };
    fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
    fs.writeFileSync(path.join(root, 'test-results/audit-source.json'), JSON.stringify(report, null, 2));
    console.log(`${report.passed}/${report.total} v2.3 regression checks passed`);
    if (report.failed) process.exitCode = 1;
})();
