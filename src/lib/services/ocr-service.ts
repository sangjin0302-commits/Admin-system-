export type OcrResult = {
  text: string;
  confidence: number;
  language?: string;
  fields?: Record<string, string>;
};

async function callGoogleVision(imageBase64: string): Promise<OcrResult | null> {
  const key = process.env.GOOGLE_VISION_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageBase64 },
              features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
            },
          ],
        }),
      }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      responses?: {
        fullTextAnnotation?: { text?: string };
        textAnnotations?: { description?: string; locale?: string }[];
      }[];
    };
    const r = json.responses?.[0];
    const text = r?.fullTextAnnotation?.text ?? r?.textAnnotations?.[0]?.description ?? "";
    const language = r?.textAnnotations?.[0]?.locale;
    return { text, confidence: text ? 0.92 : 0, language };
  } catch {
    return null;
  }
}

export async function extractText(
  imageBase64: string,
  mimeType: string
): Promise<OcrResult> {
  void mimeType;
  const real = await callGoogleVision(imageBase64);
  if (real) return real;
  return {
    text: "[mock OCR] Sample extracted text. Configure GOOGLE_VISION_API_KEY for real OCR.",
    confidence: 0,
    language: "und",
  };
}

export async function extractIdCard(imageBase64: string): Promise<{
  name?: string;
  idNumber?: string;
  nationality?: string;
  rawText: string;
}> {
  const ocr = await extractText(imageBase64, "image/jpeg");
  const text = ocr.text;
  const result: {
    name?: string;
    idNumber?: string;
    nationality?: string;
    rawText: string;
  } = { rawText: text };

  // Korean Resident Registration Number: 6 digits - 7 digits
  const krn = text.match(/(\d{6})\s*-\s*(\d{7})/);
  if (krn) result.idNumber = `${krn[1]}-${krn[2]}`;

  // Foreigner passport / alien reg number patterns
  const passport = text.match(/\b([A-Z]\d{8})\b/);
  if (!result.idNumber && passport) result.idNumber = passport[1];

  // Name: Korean (성명 / 이름) or Name: line
  const krName = text.match(/(?:성명|이름)\s*[:\s]\s*([가-힣]{2,5})/);
  if (krName) result.name = krName[1];
  const enName = text.match(/(?:Name|NAME)\s*[:\s]+([A-Z][A-Za-z\s'-]{2,40})/);
  if (!result.name && enName) result.name = enName[1].trim();

  // Nationality
  const nat = text.match(/(?:국적|Nationality)\s*[:\s]+([A-Za-z가-힣]{2,30})/);
  if (nat) result.nationality = nat[1].trim();

  return result;
}

export async function extractInvoice(imageBase64: string): Promise<{
  vendor?: string;
  amount?: number;
  date?: string;
  rawText: string;
}> {
  const ocr = await extractText(imageBase64, "image/jpeg");
  const text = ocr.text;
  const result: {
    vendor?: string;
    amount?: number;
    date?: string;
    rawText: string;
  } = { rawText: text };

  // Vendor: first non-empty line, or "From:" / "공급자"
  const vendorMatch = text.match(/(?:공급자|상호|Vendor|From)\s*[:\s]+([^\n]{2,50})/);
  if (vendorMatch) {
    result.vendor = vendorMatch[1].trim();
  } else {
    const firstLine = text.split(/\n/).find((l) => l.trim().length > 1);
    if (firstLine) result.vendor = firstLine.trim().slice(0, 60);
  }

  // Amount: largest currency-looking number
  const amounts = Array.from(
    text.matchAll(/(?:₩|\$|USD|KRW)?\s*([\d,]+(?:\.\d{1,2})?)/g)
  )
    .map((m) => Number(m[1].replace(/,/g, "")))
    .filter((n) => !Number.isNaN(n) && n > 0);
  if (amounts.length > 0) result.amount = Math.max(...amounts);

  // Date: YYYY-MM-DD, YYYY/MM/DD, or DD/MM/YYYY
  const date =
    text.match(/\b(20\d{2}[-./]\d{1,2}[-./]\d{1,2})\b/) ??
    text.match(/\b(\d{1,2}[-./]\d{1,2}[-./]20\d{2})\b/);
  if (date) result.date = date[1];

  return result;
}
