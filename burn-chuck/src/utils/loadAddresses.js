import addressUrl from '../assets/csv/address.csv';

// Parse CSV text into hierarchical mapping: provinces -> cities -> districts
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = lines.shift();
  const provinces = {};

  for (const line of lines) {
    const parts = line.split(',');
    if (parts.length < 3) continue;
    const [province, city, district] = parts.map((s) => s.trim());
    if (!province) continue;
    if (!provinces[province]) provinces[province] = {};
    if (!provinces[province][city]) provinces[province][city] = new Set();
    provinces[province][city].add(district);
  }

  // Convert sets to arrays
  const result = {};
  for (const p of Object.keys(provinces).sort()) {
    result[p] = {};
    for (const c of Object.keys(provinces[p]).sort()) {
      result[p][c] = Array.from(provinces[p][c]).sort();
    }
  }
  return result;
}

export async function loadAddresses() {
  const res = await fetch(addressUrl);
  const text = await res.text();
  return parseCsv(text);
}
