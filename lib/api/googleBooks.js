/**
 * Google Books — free ISBN lookup
 * https://www.googleapis.com/books/v1/volumes?q=isbn:XXXX
 */
const BASE_URL = 'https://www.googleapis.com/books/v1/volumes'

async function lookupByBarcode(barcode) {
  // Google Books accepts ISBN-10/13 (which are EAN-13 book codes starting with 977, 978, 979)
  if (!/^(977|978|979)\d+/.test(barcode) && barcode.length !== 10) {
    return { found: false, source: 'Google Books', note: 'Not a book ISBN' }
  }
  try {
    const res = await fetch(`${BASE_URL}?q=isbn:${encodeURIComponent(barcode)}`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return { found: false, source: 'Google Books' }
    const data = await res.json()
    if (data.totalItems > 0 && data.items?.[0]?.volumeInfo) {
      const v = data.items[0].volumeInfo
      return {
        found: true,
        source: 'Google Books',
        isbn: barcode,
        title: v.title,
        authors: v.authors,
        publisher: v.publisher,
        publishedDate: v.publishedDate,
        description: v.description,
        thumbnail: v.imageLinks?.thumbnail,
      }
    }
    return { found: false, source: 'Google Books' }
  } catch {
    return { found: false, source: 'Google Books', error: 'network' }
  }
}

module.exports = { lookupByBarcode }
