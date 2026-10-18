import { test, expect } from '@playwright/test';

// Requires the real Next.js dev server started by playwright.config.ts.
// This suite is shipped for execution after npm ci; static screenshots are not a substitute.
test('mobile header has space for the wordmark and only its essential actions', async ({ page }) => {
    for (const width of [320, 375, 390, 430, 768]) {
        await page.setViewportSize({ width, height: 844 });
        await page.goto('/');
        const header = page.locator('header').first();
        await expect(header.getByRole('button', { name: 'Open navigation', exact: true })).toBeVisible();
        await expect(header.getByRole('button', { name: 'Search products', exact: true }).filter({ visible: true })).toHaveCount(1);
        await expect(header.getByRole('link', { name: 'My account', exact: true })).toBeHidden();
        const logo = await header.locator('.wordmark').boundingBox();
        const actions = await header.locator('.mobile-header-actions').boundingBox();
        const bag = await header.locator('.bag-trigger').boundingBox();
        expect(logo && actions && bag).toBeTruthy();
        expect(actions!.x + actions!.width).toBeLessThanOrEqual(logo!.x + 1);
        expect(logo!.x + logo!.width).toBeLessThanOrEqual(bag!.x + 1);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
});

test('collection drawer expands the right category and closes even for the current route', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/category/sherwani');
    const opener = page.getByRole('button', { name: 'Open navigation', exact: true });
    await opener.click();
    const drawer = page.getByRole('dialog', { name: 'Explore Threazle', exact: true });
    await expect(drawer).toBeVisible();
    const category = drawer.getByRole('button', { name: /^Sherwani/ });
    await category.click();
    await expect(category).toHaveAttribute('aria-expanded', 'true');
    await expect(drawer.getByRole('link', { name: 'Ready-made', exact: true })).toBeVisible();
    await drawer.getByRole('link', { name: 'Shop all Sherwani', exact: true }).click();
    await expect(drawer).toHaveCount(0);
    await expect(page).toHaveURL(/\/category\/sherwani$/);
    await opener.click();
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
    await expect(opener).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
});

test('drawer search uses the actual query and lower account links remain reachable', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
    const drawer = page.getByRole('dialog', { name: 'Explore Threazle', exact: true });
    await drawer.getByRole('link', { name: 'Track order', exact: true }).scrollIntoViewIfNeeded();
    await expect(drawer.getByRole('link', { name: 'Track order', exact: true })).toBeVisible();
    await drawer.getByLabel('Search collections and designs', { exact: true }).fill('Mehr');
    await drawer.getByRole('button', { name: 'Search collections and designs', exact: true }).click();
    await expect(page).toHaveURL(/\/search\?q=Mehr$/);
    await expect(drawer).toHaveCount(0);
    await expect(page.locator('.product-card')).toHaveCount(1);
    await expect(page.locator('.catalog-search-form input')).toHaveValue('Mehr');
});

test('fabric quick look shows the selected fabric instead of navigating immediately', async ({ page }) => {
    await page.goto('/fabrics');
    const first = page.locator('.fabric-card-wrap').first();
    const name = await first.locator('h3').innerText();
    await first.getByRole('button', { name: /^Quick look at / }).click();
    const dialog = page.getByRole('dialog', { name, exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Choose a compatible design', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
});

test('shop and new-arrivals routes have different scopes and unknown fabric gets a 404', async ({ page }) => {
    await page.goto('/shop');
    await expect(page.getByRole('heading', { name: 'The collection', exact: true })).toBeVisible();
    await page.goto('/new-arrivals');
    await expect(page.getByRole('heading', { name: 'New arrivals', exact: true })).toBeVisible();
    // The source regression suite independently verifies fixture membership.
    expect(await page.locator('.product-card').count()).toBeGreaterThan(0);
    const result = await page.goto('/fabrics/does-not-exist');
    expect(result?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: /not found|chapter|another path/i })).toBeVisible();
});
