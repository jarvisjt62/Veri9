# Round 3 Fix Plan

## Issue 1: Admin dashboard section for form submissions + emails
- [x] Built /admin submissions section (prev commit)
- [x] Added logEmailAttempt() to lib/integrations-store.ts (namespace "emaillog:")
- [x] /api/admin/email-log route (GET list, DELETE single, DELETE ?all=1 clear)
- [x] /api/notify logs every attempt — sent, stored, failed, skipped
- [x] New Admin → Email Log section with status filter tabs, expandable rows, delete/clear

## Issue 2: Mobile responsiveness
- [x] Added comprehensive mobile CSS rules in globals.css
- [x] Prevent horizontal overflow (html/body overflow-x hidden, max-width 100vw)
- [x] Tables/pre/code scroll within instead of overflowing
- [x] Long words break, wide blocks collapse to fit screen
- [x] Modal dialogs fit mobile viewport, scroll internally
- [x] Fixed-width elements (min-width 800-1000+px) unlocked on mobile
- [x] Admin already had hamburger sidebarOpen pattern

## Issue 3: Hide scrollbars during scrolling
- [x] Global CSS hides scrollbars on html/body/all elements
- [x] scrollbar-width: none + ::-webkit-scrollbar display:none

## Issue 4: Scan result improvements
- [x] Google Vision OCR lib: distinguish apiError vs noTextFound
- [x] Photo route: 3 friendly states (not-configured / service-unavailable / photo-unclear)
- [x] Better copy: tips to retake photo, suggest Barcode/Serial alternatives
- [x] Added HOUSEHOLD category for Dawn/Tide/Clorox/dish soap etc (fixes BEVERAGE misclass)
- [x] Household detection runs BEFORE beverage, in name-based + OFF + barcodeSpider paths
- [x] Bumped ENGINE_VERSION 8→9 to invalidate stale caches
