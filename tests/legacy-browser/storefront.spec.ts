import { test, expect } from '@playwright/test';
// Real browser tests to run after npm installation. Demo mode cannot place real orders.
test('header remains usable across mouse movement, keyboard input and scrolling', async ({ page, isMobile }) => {
    await page.goto('/');
    if (isMobile) {
        await page.getByRole('button', { name: 'Open navigation' }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.getByRole('dialog').getByText('Sherwani', { exact: true }).first().click();
        await expect(page.getByRole('dialog').getByRole('link', { name: 'Ready-made', exact: true }).first()).toBeVisible();
        await page.keyboard.press('Escape');
    }
    else {
        const trigger = page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Sherwani', exact: true });
        await trigger.hover();
        const menu = page.locator('#collection-menu');
        await expect(menu).toBeVisible();
        await menu.getByRole('link', { name: 'Ready-made', exact: true }).hover();
        await expect(menu).toBeVisible();
        await page.keyboard.press('Escape');
        await trigger.focus();
        await page.keyboard.press('ArrowDown');
        await expect(menu).toBeVisible();
        await expect(menu.getByRole('link', { name: 'Explore all' })).toBeFocused();
        await page.keyboard.press('Escape');
    }
    // End keyboard/menu interaction before checking automatic scroll behavior.
    await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur();
        document.documentElement.style.scrollBehavior = 'auto';
    });
    await page.mouse.move(10, 400);
    await page.evaluate(() => window.scrollTo(0, 1000));
    await expect(page.locator('header')).toHaveAttribute('data-header-mode', 'hidden');
    await page.evaluate(() => window.scrollTo(0, 850));
    await expect(page.locator('header')).toHaveAttribute('data-header-mode', 'revealed');
    await expect.poll(async () => (await page.locator('header').boundingBox())?.y).toBeGreaterThanOrEqual(-1);
    await page.evaluate(() => window.scrollTo(0, 1100));
    await expect(page.locator('header')).toHaveAttribute('data-header-mode', 'hidden');
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator('header')).toHaveAttribute('data-header-mode', 'flow');
});
test('ready-made bag persists in the same tab and supports removing a line', async ({ page }) => {
    await page.goto('/product/the-mehr-sherwani');
    await expect(page.getByRole('button', { name: 'XL', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'M', exact: true }).click();
    await page.getByRole('button', { name: 'Add to bag', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByRole('link', { name: 'View your bag' }).click();
    await expect(page.getByText('The Mehr Sherwani').first()).toBeVisible();
    await page.reload();
    await expect(page.getByText('The Mehr Sherwani').first()).toBeVisible();
    await page.getByRole('button', { name: /remove/i }).first().click();
    await expect(page.getByText(/bag is empty|story waiting|bag is waiting/i).first()).toBeVisible();
});
test('custom measurements are validated and different fits stay separate', async ({ page }) => {
    async function addFit(chest: number) {
        await page.goto('/product/the-mehr-sherwani?mode=stitch');
        await page.getByRole('button', { name: /Classic band collar/ }).click();
        await page.getByRole('button', { name: 'Continue', exact: true }).click();
        await page.locator('.fabric-choice:not([disabled])').first().click();
        await page.getByRole('button', { name: 'Continue', exact: true }).click();
        await page.getByRole('button', { name: 'Continue', exact: true }).click();
        await expect(page.locator('.wizard .field-error').first()).toBeVisible();
        const measurements: Record<string, number> = { 'Chest (in)': chest, 'Waist (in)': 36, 'Shoulder (in)': 18, 'Sleeve length (in)': 24, 'Garment length (in)': 44, 'Neck (in)': 15.5 };
        for (const [label, value] of Object.entries(measurements))
            await page.getByLabel(label, { exact: true }).fill(String(value));
        await page.getByRole('button', { name: 'Continue', exact: true }).click();
        await page.getByRole('button', { name: 'Add to bag', exact: true }).click();
        await page.getByRole('dialog').getByRole('link', { name: 'View your bag' }).click();
    }
    await addFit(40);
    await addFit(42);
    await expect(page.locator('.cart-line')).toHaveCount(2);
    const cart = await page.evaluate(() => JSON.parse(sessionStorage.getItem('threazle.preview.cart.v2') || '{}'));
    expect(cart.items.map((item: any) => item.customization.measurementSnapshot.chest).sort()).toEqual([40, 42]);
});
test('search and category state reflect the requested URL, not a fixed catalog', async ({ page }) => {
    await page.goto('/search?q=no-such-garment-xyz');
    await expect(page.locator('.product-card')).toHaveCount(0);
    await page.goto('/category/waistcoat?mode=ready_made&sort=price_asc');
    await expect(page.locator('.product-card').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Waistcoat', exact: true }).first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2);
    expect(overflow).toBe(false);
});
test('preview checkout cannot fabricate a purchase or collect card numbers', async ({ page }) => {
    await page.goto('/product/the-mehr-sherwani');
    await page.getByRole('button', { name: 'M', exact: true }).click();
    await page.getByRole('button', { name: 'Add to bag', exact: true }).click();
    await page.getByRole('dialog').getByRole('link', { name: 'Continue to checkout' }).click();
    await expect(page.getByText('Design preview. Forms can be explored', { exact: false })).toBeVisible();
    await expect(page.locator('input[autocomplete="cc-number"]')).toHaveCount(0);
    await expect(page.locator('input[autocomplete="cc-csc"]')).toHaveCount(0);
    const persistent = await page.evaluate(() => JSON.stringify(Object.entries(localStorage)));
    expect(persistent).not.toContain('measurementSnapshot');
});
test('guest account access and unknown product URLs are honest states', async ({ page }) => {
    await page.goto('/account/orders');
    await expect(page.getByText('Your personal corner of Threazle.')).toBeVisible();
    await page.goto('/product/this-product-does-not-exist');
    await expect(page.getByRole('heading', { name: /not found|lost|another path|turned a page|chapter is missing/i }).first()).toBeVisible();
});


test('commerce headers never float or reveal while scrolling', async ({ page }) => {
    for (const route of ['/new-arrivals', '/category/sherwani', '/product/the-mehr-sherwani', '/cart', '/checkout', '/account/login']) {
        await page.goto(route);
        const header = page.locator('header').first();
        await expect(header).toHaveAttribute('data-header-behavior', 'normal');
        await page.evaluate(() => window.scrollTo(0, 700));
        await page.evaluate(() => window.scrollTo(0, 450));
        await expect(header).toHaveAttribute('data-header-mode', 'flow');
        await expect(header).toHaveCSS('position', 'relative');
    }
});

test('grid choices persist without making mobile cards tiny', async ({ page, isMobile }) => {
    await page.goto('/search');
    const grid = page.locator('.catalog-grid');
    if (isMobile) {
        await expect(grid).toHaveAttribute('data-columns', '2');
        await expect(page.getByRole('group', { name: 'Products per row' })).toBeHidden();
        await page.getByRole('button', { name: /^Filters/ }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.getByRole('dialog').getByLabel('Minimum', { exact: true }).fill('20000');
        await page.getByRole('dialog').getByLabel('Maximum', { exact: true }).fill('10000');
        await page.getByRole('dialog').getByRole('button', { name: 'Apply price' }).click();
        await expect(page.getByRole('alert')).toContainText('valid minimum');
        await page.keyboard.press('Escape');
    } else {
        for (const columns of [2, 4, 6]) {
            await page.getByRole('button', { name: `${columns} columns`, exact: true }).click();
            await expect(grid).toHaveAttribute('data-columns', String(columns));
            const count = await grid.evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length);
            expect(count).toBe(columns);
        }
        await page.reload();
        await expect(grid).toHaveAttribute('data-columns', '6');
        await page.setViewportSize({ width: 390, height: 844 });
        await expect(grid).toHaveAttribute('data-columns', '2');
        await page.setViewportSize({ width: 1440, height: 1000 });
        await expect(grid).toHaveAttribute('data-columns', '6');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('collar options use distinct clear detail crops, not the same outfit photo', async ({ page }) => {
    await page.goto('/product/the-mehr-sherwani?mode=stitch');
    const photos = page.locator('.style-option-image img');
    await expect(photos).toHaveCount(3);
    const imageSources = await photos.evaluateAll(elements => elements.map(element => (element as HTMLImageElement).src));
    expect(new Set(imageSources).size).toBe(3);
    await expect(page.locator('.style-reference-note')).toContainText('illustrate the collar');
    for (const image of await photos.all()) {
        await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
        const frame = await image.locator('..').boundingBox();
        expect(Math.abs((frame?.width || 0) - (frame?.height || 0))).toBeLessThan(1);
        await expect(image).toHaveCSS('object-fit', 'contain');
    }
});

test('gallery keeps one portrait frame and opens its contain-fit lightbox on request', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/product/the-mehr-sherwani');
    const frame = page.locator('.pg-stage');
    const before = await frame.boundingBox();
    expect(before).not.toBeNull();
    expect(Math.abs(before!.width / before!.height - 3 / 4)).toBeLessThan(0.01);
    await expect(page.locator('.pg-slide').first().locator('img.photo')).toHaveCSS('object-fit', 'cover');
    await frame.hover();
    await expect(page.locator('.lightbox')).toHaveCount(0);
    await page.getByRole('button', { name: 'Show photo 3 of 4', exact: true }).click();
    await expect.poll(() => page.locator('.pg-track').evaluate(element => Math.abs(element.scrollLeft / element.clientWidth - 2))).toBeLessThan(0.02);
    await expect(page.locator('.pg-count')).toHaveText('3 / 4');
    const after = await frame.boundingBox();
    expect(Math.abs(before!.width - after!.width)).toBeLessThan(1);
    expect(Math.abs(before!.height - after!.height)).toBeLessThan(1);
    await page.getByRole('button', { name: 'Open full-screen view' }).click();
    await expect(page.locator('.lightbox')).toBeVisible();
    await expect(page.locator('.lb-img')).toHaveCSS('object-fit', 'contain');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.lb-title small')).toHaveText('4 / 4');
    await page.keyboard.press('Escape');
    await expect(page.locator('.lightbox')).toHaveCount(0);
});

test('compact headings and product cards do not overflow narrow screens', async ({ page }) => {
    for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto('/new-arrivals');
        const heading = await page.locator('.page-heading').boundingBox();
        expect(heading!.height).toBeLessThan(175);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        const frames = await page.locator('.product-visual > a').evaluateAll(elements => elements.slice(0, 4).map(element => {
            const box = element.getBoundingClientRect();
            return { width: box.width, height: box.height };
        }));
        for (const frame of frames) expect(Math.abs(frame.width / frame.height - 0.75)).toBeLessThan(0.01);
    }
});
