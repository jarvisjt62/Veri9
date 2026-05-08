/**
 * Open Library (Internet Archive) API Integration
 * Free, no API key required
 * Covers 30M+ book records, lookup by ISBN (which is also a barcode)
 * ISBN-13 barcodes start with 978 or 979
 */

const BASE_URL = 'https://openlibrary.org';

/**
 * Lookup a book by ISBN barcode
 * @param {string} barcode - ISBN-10 or ISBN-13
 * @returns {object} Book data or not-found object
 */
async function lookupByBarcode(barcode) {
  try {
    // Check if this could be an ISBN (starts with 978 or 979, or is 10 digits)
    const cleaned = barcode.replace(/[^0-9X]/gi, '');
    const couldBeISBN = cleaned.startsWith('978') || cleaned.startsWith('979') || cleaned.length === 10;

    if (!couldBeISBN) {
      return { found: false, source: 'Open Library', barcode };
    }

    const url = `${BASE_URL}/api/books?bibkeys=ISBN:${cleaned}&jscmd=details&format=json`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Veri9/1.0 (product-verification)'
      }
    });

    if (!response.ok) {
      return { found: false, source: 'Open Library', barcode };
    }

    const data = await response.json();
    const key = `ISBN:${cleaned}`;

    if (data[key] && data[key].details) {
      const details = data[key].details;
      const info = data[key];

      const authors = details.authors
        ? details.authors.map(a => a.name || a.key).filter(Boolean)
        : [];

      const publishers = details.publishers
        ? (Array.isArray(details.publishers) ? details.publishers : [details.publishers])
        : [];

      const subjects = details.subjects
        ? details.subjects.slice(0, 10).map(s => (typeof s === 'string' ? s : s.name))
        : [];

      return {
        found: true,
        source: 'Open Library',
        barcode,
        name: details.title || 'Unknown',
        brand: authors.length > 0 ? authors[0] : 'Unknown',
        manufacturer: publishers.length > 0 ? publishers[0] : 'Unknown',
        category: ['book', ...subjects.slice(0, 3)],
        description: details.description
          ? (typeof details.description === 'string' ? details.description : details.description.value)
          : null,
        authors,
        publishers,
        publishYear: details.publish_date || null,
        isbn10: (details.isbn_10 && details.isbn_10.length > 0) ? details.isbn_10[0] : null,
        isbn13: (details.isbn_13 && details.isbn_13.length > 0) ? details.isbn_13[0] : null,
        pages: details.number_of_pages || null,
        language: details.languages
          ? details.languages.map(l => l.key.replace('/languages/', '')).join(', ')
          : null,
        subjects,
        image: details.covers && details.covers.length > 0
          ? `https://covers.openlibrary.org/b/id/${details.covers[0]}-L.jpg`
          : null,
        openLibraryKey: details.key || null,
        previewLink: info.preview_url || `https://openlibrary.org${details.key}`,
        productType: 'book'
      };
    }

    return { found: false, source: 'Open Library', barcode };
  } catch (error) {
    console.error('[Open Library] Lookup error:', error.message);
    return { found: false, source: 'Open Library', barcode, error: error.message };
  }
}

/**
 * Search books by title/author
 * @param {string} query
 * @returns {array} Array of books
 */
async function searchByName(query) {
  try {
    const url = `${BASE_URL}/search.json?q=${encodeURIComponent(query)}&limit=10&fields=title,author_name,isbn,cover_i,first_publish_year,publisher`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Veri9/1.0 (product-verification)'
      }
    });

    if (!response.ok) return [];

    const data = await response.json();

    if (data.docs && data.docs.length > 0) {
      return data.docs.slice(0, 10).map(doc => ({
        name: doc.title || 'Unknown',
        brand: doc.author_name ? doc.author_name[0] : 'Unknown',
        barcode: doc.isbn ? doc.isbn[0] : null,
        image: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
          : null,
        category: 'book',
        publishYear: doc.first_publish_year || null
      }));
    }

    return [];
  } catch (error) {
    console.error('[Open Library] Search error:', error.message);
    return [];
  }
}

module.exports = { lookupByBarcode, searchByName };