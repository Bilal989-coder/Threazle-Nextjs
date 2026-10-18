process.env.NEXT_PUBLIC_RELEASE_PHASE = '2';
/* Source-level UI policy tests. These do not substitute for browser/Next build tests. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
process.env.NEXT_PUBLIC_DATA_MODE = 'demo';
process.env.NEXT_PUBLIC_IMAGE_HOSTS = 'media.example.com';
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (id, parent, ...rest) {
    return originalResolve.call(this, id.startsWith('@/') ? path.join(root, 'src', id.slice(2)) : id, parent, ...rest);
};
require.extensions['.ts'] = function (module, filename) {
    module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        fileName: filename,
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText, filename);
};
const ui = require('../src/lib/storefront-ui.ts');
const media = require('../src/lib/media.ts');
const styles = require('../src/lib/style-preview.ts');
const { demoData, demoList } = require('../tests/fixtures/demo.ts');
const { imageManifest } = require('../src/data/images.generated.ts');
const results = [];
function test(name, fn) {
    try { fn(); results.push({ name, status: 'passed' }); console.log(`PASS ${name}`); }
    catch (error) { results.push({ name, status: 'failed', message: error.message }); console.error(`FAIL ${name}\n${error.stack}`); }
}
const flow = { mode: 'flow', previousY: 0, direction: 0, distance: 0 };
const hidden = { mode: 'hidden', previousY: 900, direction: 1, distance: 100 };
const revealed = { mode: 'revealed', previousY: 900, direction: -1, distance: 100 };
const sample = demoData.products.find(product => product.slug === 'the-mehr-sherwani');

test('The only density choices are 2, 4 and 6', () => assert.deepEqual(ui.GRID_CHOICES, [2, 4, 6]));
test('A stored two-column preference restores correctly', () => assert.equal(ui.parseGridColumns('2'), 2));
test('A stored six-column preference restores correctly', () => assert.equal(ui.parseGridColumns('6'), 6));
test('Corrupt stored density falls back to four', () => assert.equal(ui.parseGridColumns('evil'), 4));
test('Phones never receive six tiny columns', () => assert.equal(ui.effectiveGridColumns(6, 390), 2));
test('Tablets clamp six columns to four', () => assert.equal(ui.effectiveGridColumns(6, 1024), 4));
test('Wide desktops can show all six columns', () => assert.equal(ui.effectiveGridColumns(6, 1440), 6));
test('Two-column choice remains two on desktop', () => assert.equal(ui.effectiveGridColumns(2, 1440), 2));
test('Home is a reveal-header route', () => assert.equal(ui.usesRevealHeader('/'), true));
test('Static CMS pages reveal the header on upward scroll', () => assert.equal(ui.usesRevealHeader('/pages/about/'), true));
test('Tailoring and size help use editorial header behavior', () => { assert.ok(ui.usesRevealHeader('/custom-tailoring')); assert.ok(ui.usesRevealHeader('/size-guide')); });
test('All commerce, account and payment routes keep the header in flow', () => {
    for (const route of ['/new-arrivals', '/category/sherwani', '/product/the-mehr-sherwani', '/fabrics', '/sale', '/search', '/cart', '/checkout', '/payment', '/account', '/account/orders', '/track-order', '/order/confirmation/1']) assert.equal(ui.usesRevealHeader(route), false, route);
});
test('A normal-route header cannot float, even while scrolling up', () => assert.equal(ui.nextHeaderState(revealed, 800, 126, false).mode, 'flow'));
test('Home header stays natural before it has left the viewport', () => assert.equal(ui.nextHeaderState(flow, 100, 126, true).mode, 'flow'));
test('Home header hides after scrolling down beyond its natural slot', () => assert.equal(ui.nextHeaderState(flow, 900, 126, true).mode, 'hidden'));
test('Home header reveals after deliberate upward movement', () => assert.equal(ui.nextHeaderState(hidden, 880, 126, true).mode, 'revealed'));
test('One-pixel scrolling jitter does not make the header flicker', () => assert.equal(ui.nextHeaderState(hidden, 899, 126, true).mode, 'hidden'));
test('Small consecutive upward movements eventually reveal the header', () => {
    let state = hidden;
    for (const y of [896, 892, 888]) state = ui.nextHeaderState(state, y, 126, true);
    assert.equal(state.mode, 'revealed');
});
test('Returning to page top restores normal layout', () => assert.equal(ui.nextHeaderState(revealed, 0, 126, true).mode, 'flow'));
test('Negative overscroll is clamped to the top', () => assert.equal(ui.nextHeaderState(hidden, -20, 126, true).previousY, 0));
test('An open menu or focused header is not hidden by scrolling', () => assert.equal(ui.nextHeaderState(revealed, 1000, 126, true, true).mode, 'revealed'));
test('Repeated fabric filters preserve both backend values', () => {
    const query = new URLSearchParams(ui.setCatalogFilter('page=3&q=sherwani', 'fabricTypes', ['Cotton', 'Wool']));
    assert.deepEqual(query.getAll('fabricTypes'), ['Cotton', 'Wool']); assert.equal(query.has('page'), false); assert.equal(query.get('q'), 'sherwani');
});
test('Removing one fabric chip preserves the other selection', () => assert.deepEqual(new URLSearchParams(ui.removeCatalogFilter('fabricTypes=Cotton&fabricTypes=Wool', 'fabricTypes', 'Cotton')).getAll('fabricTypes'), ['Wool']));
test('Clearing filters preserves search, sorting and fabric-first context', () => assert.equal(ui.clearCatalogFilters('q=mehr&sort=price_asc&fabric=fab1&mode=stitch&page=2'), 'q=mehr&sort=price_asc&fabric=fab1'));
test('Pagination changes do not clear active filters', () => assert.equal(new URLSearchParams(ui.setCatalogFilter('mode=stitch', 'page', '2')).get('mode'), 'stitch'));
test('Sample max-price zero returns no positive-price products', () => assert.equal(demoList({ priceMax: 0 }).total, 0));
test('Known photo filenames resolve to manifest metadata', () => assert.equal(media.imageKey('/images/products/cream-sherwani-1-823.webp'), 'cream-sherwani-1'));
test('Unknown photo filenames are not invented as manifest entries', () => assert.equal(media.imageKey('/images/products/missing-100.webp'), null));
test('A small product preview resolves to the original highest-resolution source', () => {
    const key = 'burgundy-shalwar-qameez-1', item = imageManifest[key];
    assert.equal(media.largestPhoto(`/images/products/${key}-${Math.min(...item.widths)}.webp`), `/images/products/${key}-${Math.max(...item.widths)}.webp`);
});
test('Different size derivatives identify the same photograph', () => {
    const key = 'cream-sherwani-1', widths = imageManifest[key].widths;
    assert.equal(media.photoIdentity(`/images/products/${key}-${widths[0]}.webp`), media.photoIdentity(`/images/products/${key}-${widths.at(-1)}.webp`));
});
test('Square collar assets have correct intrinsic aspect metadata', () => { const size = media.photoMetadata('/images/details/classic-band-collar-640.webp'); assert.equal(size.width / size.height, 1); });
test('Known remote approved images are retained', () => assert.equal(media.largestPhoto('https://media.example.com/photo.webp'), 'https://media.example.com/photo.webp'));
test('Unknown remote image hosts fail safely', () => assert.equal(media.largestPhoto('https://unapproved.example/image.jpg'), media.PLACEHOLDER_IMAGE));
test('A square photograph is contained without stretching', () => assert.deepEqual(ui.containImage({ width: 600, height: 600 }, { width: 600, height: 800 }), { width: 600, height: 600 }));
test('Portrait and landscape images keep their original proportions', () => {
    for (const image of [{ width: 823, height: 1057 }, { width: 1206, height: 1809 }, { width: 2000, height: 1000 }]) {
        const fit = ui.containImage(image, { width: 600, height: 800 });
        assert.ok(Math.abs(fit.width / fit.height - image.width / image.height) < 1e-8);
        assert.ok(fit.width <= 600 && fit.height <= 800);
    }
});
test('Zero-sized image metadata cannot divide by zero', () => assert.deepEqual(ui.containImage({ width: 0, height: 1 }, { width: 1, height: 1 }), { width: 0, height: 0 }));
test('Three demo collar options use three distinct references', () => assert.equal(new Set(sample.variants.map(variant => styles.resolveStylePreview(variant, sample).source)).size, 3));
test('Repeated full-body collar images are replaced by matching reference crops', () => {
    const product = { ...sample, variants: sample.variants.map(variant => ({ ...variant, image: sample.images[0].url })) };
    const resolved = product.variants.map(variant => styles.resolveStylePreview(variant, product));
    assert.equal(new Set(resolved.map(item => item.source)).size, 3); assert.ok(resolved.every(item => item.isReference));
});
test('A unique approved backend collar photo is not overridden', () => {
    const variant = { ...sample.variants[0], image: 'https://media.example.com/actual-collar.webp' };
    const result = styles.resolveStylePreview(variant, { ...sample, variants: [variant] });
    assert.equal(result.source, variant.image); assert.equal(result.isReference, false);
});
test('An unknown style name is not assigned a guessed collar', () => {
    const variant = { ...sample.variants[0], styleName: 'Other custom style', image: '/images/placeholder.svg' };
    assert.equal(styles.resolveStylePreview(variant, { ...sample, variants: [variant] }).source, '/images/placeholder.svg');
});
test('All demo variant media references exist locally', () => {
    for (const product of demoData.products) for (const variant of product.variants) assert.ok(fs.existsSync(path.join(root, 'public', variant.image)), variant.image);
});
const report = { suite: 'Source UI policy and media tests', total: results.length, passed: results.filter(result => result.status === 'passed').length, failed: results.filter(result => result.status === 'failed').length, results };
fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
fs.writeFileSync(path.join(root, 'test-results/ui-results.json'), JSON.stringify(report, null, 2));
console.log(`\n${report.passed}/${report.total} UI source checks passed. Full browser/build tests are separate.`);
process.exitCode = report.failed ? 1 : 0;
