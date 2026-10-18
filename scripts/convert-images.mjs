/** Convert supplied raster assets, preserving relative filenames. Never overwrites originals. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
const args = process.argv.slice(2);
const option = name => {
    const i = args.indexOf(name);
    return i < 0 ? undefined : args[i + 1];
};
if (!option('--source')) {
    console.error('Usage: npm run images:convert -- --source ../Threazle-main/frontend/public --output public/converted [--overwrite]');
    process.exit(1);
}
const source = path.resolve(option('--source'));
const output = path.resolve(option('--output') || 'public/converted');
if (output === source || output.startsWith(source + path.sep)) {
    throw new Error('The output must be outside the source tree. Originals must remain untouched.');
}
const accepted = /\.(jpe?g|png|webp|avif|tiff?)$/i;
async function walk(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const result = [];
    for (const entry of entries) {
        if (entry.isSymbolicLink())
            continue;
        if (['node_modules', '.git', '.next'].includes(entry.name))
            continue;
        const file = path.join(directory, entry.name);
        if (entry.isDirectory())
            result.push(...await walk(file));
        else if (entry.isFile() && accepted.test(entry.name))
            result.push(file);
    }
    return result;
}
const files = await walk(source);
if (!files.length)
    throw new Error('No supported raster images were found in the source folder.');
const manifest = [], targets = new Set();
for (const file of files) {
    const relative = path.relative(source, file);
    const target = path.join(output, relative.replace(/\.[^.]+$/, '.webp'));
    if (targets.has(target))
        throw new Error(`Filename collision: ${relative}`);
    targets.add(target);
    try {
        await fs.access(target);
        if (!args.includes('--overwrite'))
            throw new Error(`Already exists: ${target}. Use --overwrite intentionally.`);
    }
    catch (error) {
        if (error.code !== 'ENOENT')
            throw error;
    }
    const original = await fs.readFile(file);
    const image = sharp(original, { limitInputPixels: 40000000 }).rotate();
    const metadata = await image.metadata();
    if ((metadata.pages || 1) > 1)
        throw new Error(`Animated images need individual review: ${relative}`);
    const logo = /logo|icon|mark/i.test(path.basename(file));
    const converted = await image.resize({ width: logo ? 1024 : 1800, height: logo ? 1024 : 2400, fit: 'inside', withoutEnlargement: true })
        .webp(logo ? { lossless: true, effort: 6 } : { quality: 85, effort: 6 }).toBuffer();
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, converted);
    const result = await sharp(converted).metadata();
    manifest.push({ source: relative, output: path.relative(process.cwd(), target), width: result.width,
        height: result.height, sourceBytes: original.length, outputBytes: converted.length,
        sha256: createHash('sha256').update(converted).digest('hex') });
    console.log(`${relative} -> ${path.relative(process.cwd(), target)} (${converted.length} bytes)`);
}
await fs.writeFile(path.join(output, 'conversion-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Converted ${manifest.length} images. Map their URLs to the correct catalog records; conversion does not update the backend database.`);
