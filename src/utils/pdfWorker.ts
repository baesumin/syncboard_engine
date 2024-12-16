import { PDFDocument } from "pdf-lib";

self.onmessage = async (e) => {
  const { type, data } = e.data;

  switch (type) {
    case "LOAD_PDF": {
      const pdfDoc = await PDFDocument.load(data.base64);
      const page = pdfDoc.getPage(0);
      const size = page.getSize();
      const pageCount = pdfDoc.getPageCount();

      self.postMessage({
        type: "PDF_LOADED",
        data: {
          size,
          pageCount,
        },
      });
      break;
    }
  }
};
