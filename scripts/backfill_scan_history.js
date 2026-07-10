/**
 * Backfill script — re-verifies every scan_history row currently flagged
 * COUNTERFEIT or SUSPICIOUS against the CURRENT (fixed) verification engine
 * and updates that row IN PLACE with the corrected verdict, so affected
 * users see the corrected result immediately without having to manually
 * re-scan or re-verify.
 *
 * Safety:
 *  - Dry-run by default. Pass --apply to actually write changes.
 *  - Writes a full audit log (before/after) to scripts/backfill_log_<ts>.json
 *  - Only updates status/trust_score/full_result — leaves scanned_at,
 *    barcode, user_id, etc untouched, so history timeline is preserved.
 *  - Adds full_result.correctedAt + full_result.correctionNote so the
 *    dashboard can (optionally) show a "this result was corrected" badge.
 */
global.WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const { verifyProduct } = require('../lib/verification/engine.js');
const cache = require('../lib/verification/cache.js');
const fs = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: rows, error } = await supabase
    .from('scan_history')
    .select('id, user_id, barcode, product_name, brand, status, trust_score, full_result, scanned_at')
    .in('status', ['COUNTERFEIT', 'SUSPICIOUS'])
    .order('scanned_at', { ascending: false });

  if (error) { console.error('Query error:', error); process.exit(1); }

  console.log(`Mode: ${APPLY ? 'APPLY (writing changes)' : 'DRY RUN (no changes will be written)'}`);
  console.log(`Total flagged rows: ${rows.length}`);

  const uniqueBarcodes = [...new Set(rows.map(r => r.barcode))];
  const freshByBarcode = {};
  for (const bc of uniqueBarcodes) {
    await cache.invalidate(bc);
    // Re-verify twice and prefer the non-COUNTERFEIT result if they disagree,
    // to avoid re-baking-in any remaining transient flakiness from a
    // still-flaky external API into the corrected record.
    const a = await verifyProduct(bc, {});
    let final = a;
    if (a.status === 'COUNTERFEIT' || a.status === 'SUSPICIOUS') {
      await cache.invalidate(bc);
      const b = await verifyProduct(bc, {});
      if (b.status !== 'COUNTERFEIT' && b.status !== 'SUSPICIOUS') final = b;
    }
    freshByBarcode[bc] = final;
  }

  const log = [];
  let updated = 0, skippedSame = 0, failed = 0;

  for (const r of rows) {
    const fresh = freshByBarcode[r.barcode];
    if (!fresh) { failed++; continue; }

    if (fresh.status === r.status) {
      skippedSame++;
      log.push({ id: r.id, barcode: r.barcode, action: 'skipped_same', oldStatus: r.status, newStatus: fresh.status });
      continue;
    }

    const correctedFullResult = {
      ...fresh,
      correctedAt: new Date().toISOString(),
      correctionNote: `Automatically re-verified and corrected on ${new Date().toISOString().slice(0,10)} after a verification engine bug fix. Original verdict at time of scan: ${r.status} (${r.trust_score}%).`,
      previousStatus: r.status,
      previousTrustScore: r.trust_score,
    };

    log.push({
      id: r.id, barcode: r.barcode, action: APPLY ? 'updated' : 'would_update',
      oldStatus: r.status, oldScore: r.trust_score,
      newStatus: fresh.status, newScore: fresh.trustScore,
      user_id: r.user_id, scanned_at: r.scanned_at,
    });

    console.log(`${APPLY ? 'UPDATING' : '[dry-run] would update'} id=${r.id} barcode=${r.barcode} ${r.status}(${r.trust_score}%) -> ${fresh.status}(${fresh.trustScore}%)`);

    if (APPLY) {
      const { error: updErr } = await supabase
        .from('scan_history')
        .update({
          status: fresh.status,
          trust_score: fresh.trustScore,
          full_result: correctedFullResult,
        })
        .eq('id', r.id);
      if (updErr) {
        console.error(`  FAILED to update ${r.id}:`, updErr.message);
        failed++;
        continue;
      }
    }
    updated++;
  }

  const logPath = path.join(__dirname, `backfill_log_${Date.now()}.json`);
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));

  console.log(`\n--- Summary ---`);
  console.log(`${APPLY ? 'Updated' : 'Would update'}: ${updated}`);
  console.log(`Skipped (verdict unchanged): ${skippedSame}`);
  console.log(`Failed: ${failed}`);
  console.log(`Log written to: ${logPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
