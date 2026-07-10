/**
 * Audit script — READ ONLY. Lists all scan_history rows currently marked
 * COUNTERFEIT or SUSPICIOUS, re-verifies each unique barcode against the
 * CURRENT engine (post Round 30f, ENGINE_VERSION 22), and reports how many
 * would change if we backfilled. Does NOT write anything.
 */
global.WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const { verifyProduct } = require('../lib/verification/engine.js');
const cache = require('../lib/verification/cache.js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: rows, error } = await supabase
    .from('scan_history')
    .select('id, user_id, barcode, product_name, brand, status, trust_score, scanned_at')
    .in('status', ['COUNTERFEIT', 'SUSPICIOUS'])
    .order('scanned_at', { ascending: false });

  if (error) { console.error('Query error:', error); process.exit(1); }

  console.log(`Total flagged rows (COUNTERFEIT/SUSPICIOUS): ${rows.length}`);

  const uniqueBarcodes = [...new Set(rows.map(r => r.barcode))];
  console.log(`Unique barcodes: ${uniqueBarcodes.length}\n`);

  const verdictMap = {};
  for (const bc of uniqueBarcodes) {
    await cache.invalidate(bc);
    const fresh = await verifyProduct(bc, {});
    verdictMap[bc] = { status: fresh.status, trustScore: fresh.trustScore, name: fresh.productInfo && fresh.productInfo.name };
    console.log(`${bc}  =>  NEW: ${fresh.status} (${fresh.trustScore}%)  [${fresh.productInfo && fresh.productInfo.name}]`);
  }

  console.log('\n--- Row-by-row impact ---');
  let wouldChange = 0;
  for (const r of rows) {
    const nv = verdictMap[r.barcode];
    const changed = nv.status !== r.status;
    if (changed) wouldChange++;
    console.log(`${changed ? 'CHANGE' : 'same  '} | id=${r.id} barcode=${r.barcode} old=${r.status}(${r.trust_score}%) new=${nv.status}(${nv.trustScore}%) user=${r.user_id} scanned_at=${r.scanned_at}`);
  }
  console.log(`\nRows that WOULD change: ${wouldChange} / ${rows.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
