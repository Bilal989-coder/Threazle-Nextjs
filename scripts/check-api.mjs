/** Read-only adapter preflight. No auth, customer data, email or database writes. */
const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1').replace(/\/$/, '');
const paths = ['/categories', '/products?page=1&pageSize=1', '/fabrics?page=1&pageSize=1', '/payments/methods'];
let failed = 0;
for (const endpoint of paths) {
    try {
        const res = await fetch(base + endpoint, { signal: AbortSignal.timeout(10000), headers: { Accept: 'application/json' } });
        const json = await res.json();
        if (!res.ok || json.success !== true || !('data' in json))
            throw new Error(`Unexpected status/envelope: ${res.status}`);
        console.log(`PASS GET ${endpoint}`);
    }
    catch (error) {
        failed++;
        console.error(`FAIL GET ${endpoint}: ${error.message}`);
    }
}
console.log('This read-only script does not verify browser CORS, Supabase sign-in, stock transactions or checkout.');
process.exitCode = failed ? 1 : 0;
