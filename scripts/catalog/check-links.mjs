// Read-only HTTP audit. A blocked request is not treated as a dead link.
// Usage: node scripts/catalog/check-links.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const links = JSON.parse(await fs.readFile(path.join(root, 'src/data/education/credentialLinks.json'), 'utf8'));
const destinations = [...new Set(Object.values(links).flatMap(record => record.links.map(link => link.url)))];
const report = [];
let index = 0;
async function worker() {
  while (index < destinations.length) {
    const url = destinations[index++];
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'CEShieldCatalog/0.1 (+https://www.ceshield.com/about)' } });
      await response.body?.cancel();
      report.push({ url, status: response.status, finalUrl: response.url, checkedAt: new Date().toISOString() });
    } catch (error) {
      report.push({ url, status: 'unreachable', error: error.cause?.code || error.message, checkedAt: new Date().toISOString() });
    }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
await fs.mkdir(path.join(root, 'artifacts/catalog'), { recursive: true });
await fs.writeFile(path.join(root, 'artifacts/catalog/credential-link-audit.json'), JSON.stringify(report, null, 2) + '\n');
const broken = report.filter(row => [404, 410].includes(row.status));
console.log(JSON.stringify({ checked: report.length, reachable: report.filter(row => row.status >= 200 && row.status < 400).length, broken, restrictedOrUnreachable: report.filter(row => row.status === 'unreachable' || row.status >= 400).length }, null, 2));
if (broken.length) process.exitCode = 1;
