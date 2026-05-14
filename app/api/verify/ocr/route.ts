import { NextRequest, NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ocrImage } = require('@/lib/api/googleVisionOcr');

export const runtime = 'nodejs';

/**
 * POST /api/verify/ocr
 *
 * Body: { imageBase64?: string, imageUrl?: string, expectedBarcode?: string }
 *
 * Runs Google Vision OCR on the provided image (either as raw base64 or a
 * publicly-fetchable URL) and returns extracted text, brand candidates,
 * product-name candidates, and any detected logos.
 *
 * The scanner UI uses this when the barcode is UNREADABLE or when the
 * database verdict is ambiguous and we want to cross-reference the printed
 * packaging against what the barcode claims.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { imageBase64, imageUrl, expectedBarcode } = body || {};

    if (!imageBase64 && !imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Provide imageBase64 or imageUrl' },
        { status: 400 }
      );
    }

    // Strip "data:image/...;base64," prefix if present
    const cleanBase64 = typeof imageBase64 === 'string'
      ? imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '')
      : undefined;

    const result = await ocrImage({ imageBase64: cleanBase64, imageUrl });

    // Cross-check: does the OCR'd text contain the claimed barcode digits?
    let barcodeConfirmedInImage = null;
    if (expectedBarcode && result && result.fullText) {
      const expectedDigits = String(expectedBarcode).replace(/\D/g, '');
      const imageDigits = result.fullText.replace(/\D/g, '');
      barcodeConfirmedInImage = imageDigits.includes(expectedDigits);
    }

    return NextResponse.json({
      success: true,
      data: { ...result, barcodeConfirmedInImage },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'OCR failed';
    console.error('[OCR API]', msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
