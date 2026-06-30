import { PDFDocument, rgb } from "pdf-lib";
import { logger } from "@/lib/utils/logger";

export async function embedSignatureInPdf(
  pdfBytes: Uint8Array,
  signatureDataUrl: string,
  signerName: string,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Convert data URL to bytes
  const base64 = signatureDataUrl.split(",")[1];
  const sigBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const sigImage = await pdfDoc.embedPng(sigBytes);

  const lastPage = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
  const { width } = lastPage.getSize();

  // Draw signature at bottom-right
  const sigWidth = 150;
  const sigHeight = (sigImage.height / sigImage.width) * sigWidth;
  lastPage.drawImage(sigImage, {
    x: width - sigWidth - 50,
    y: 80,
    width: sigWidth,
    height: sigHeight,
  });

  // Add signer name and timestamp
  lastPage.drawText(`서명: ${signerName}`, {
    x: width - sigWidth - 50,
    y: 65,
    size: 8,
    color: rgb(0.3, 0.3, 0.3),
  });

  lastPage.drawText(`일시: ${new Date().toLocaleString("ko-KR")}`, {
    x: width - sigWidth - 50,
    y: 55,
    size: 7,
    color: rgb(0.5, 0.5, 0.5),
  });

  logger.info("[pdf-signature] embedded signature", { signerName });

  return await pdfDoc.save();
}
