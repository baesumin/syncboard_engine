import { LineCapStyle, PDFDocument, rgb } from "pdf-lib";
import { canvasEventType, PageSize, PathsType } from "../types/common";
import { isMobile } from "react-device-detect";
import { pdfjs } from "react-pdf";

export const __DEV__ = import.meta.env.MODE === "development";

export const colorMap = [
  "#202325",
  "#007AFF",
  "#54B41D",
  "#FFBB00",
  "#F34A47",
] as const;

export const colors = {
  "#202325": rgb(32 / 255, 35 / 255, 37 / 255),
  "#007AFF": rgb(0 / 255, 122 / 255, 255 / 255),
  "#54B41D": rgb(84 / 255, 180 / 255, 29 / 255),
  "#FFBB00": rgb(255 / 255, 187 / 255, 0 / 255),
  "#F34A47": rgb(243 / 255, 74 / 255, 71 / 255),
} as const;

export const getClientPosition = (
  e: canvasEventType,
  devicePixelRatio: number,
  type: "x" | "y"
) => {
  return (
    (e.nativeEvent instanceof MouseEvent
      ? e[type === "x" ? "clientX" : "clientY"]
      : e.touches[0][type === "x" ? "clientX" : "clientY"]) * devicePixelRatio
  );
};

export const getDrawingPosition = (
  canvas: React.RefObject<HTMLCanvasElement>,
  e: canvasEventType,
  devicePixelRatio: number,
  scale: number
) => {
  if (!canvas.current) {
    return { x: 0, y: 0 };
  }

  const rect = canvas.current.getBoundingClientRect(); // 캔버스의 위치와 크기를 가져옴
  const clientX = getClientPosition(e, devicePixelRatio, "x");
  const clientY = getClientPosition(e, devicePixelRatio, "y");
  const x = (clientX - devicePixelRatio * rect.left) / scale;
  const y = (clientY - devicePixelRatio * rect.top) / scale;

  return { x, y };
};

export const drawDashedLine = (
  context: CanvasRenderingContext2D,
  lastX: number,
  lastY: number,
  x: number,
  y: number
) => {
  context.setLineDash([1, 10]); // 점선 스타일 설정
  context.beginPath();
  context.globalAlpha = 1;
  context.strokeStyle = "red"; // 점선 색상
  context.lineWidth = 5;
  context.lineCap = "round";
  context.moveTo(lastX, lastY);
  context.lineTo(x, y);
  context.stroke();
  context.closePath();
  context.setLineDash([]); // 점선 스타일 초기화
};

export const drawSmoothLine = (
  context: CanvasRenderingContext2D,
  lastX: number,
  lastY: number,
  x: number,
  y: number,
  color: (typeof colorMap)[number],
  lineWidth: number,
  alpha: number
) => {
  // const offset = alpha === 1 ? 0 : 10000;
  context.beginPath();
  // context.translate(-offset, 0);
  context.globalAlpha = alpha;
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.lineCap = alpha === 1 ? "round" : "butt";
  context.lineJoin = "round";
  context.moveTo(lastX, lastY);
  context.lineTo(x, y);
  // context.shadowOffsetX = offset;
  // context.shadowColor = alpha === 1 ? "transparent" : color;
  // context.shadowBlur = alpha === 1 ? 0 : lineWidth;

  context.stroke();
  // context.translate(offset, 0);
  context.closePath();
};

export const colorToRGB = (color: (typeof colorMap)[number]) => {
  return colors[color as keyof typeof colors];
};

export const highlightPattern = (text: string, pattern: string) => {
  return text.replace(pattern, (value) => `<mark>${value}</mark>`);
};

export const getModifiedPDFBase64 = async (
  paths: {
    [pageNumber: number]: PathsType[];
  },
  base64Data: string
) => {
  // 기존 PDF 로드
  const existingPdfBytes = base64Data;
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  for (let i = 0; i < pdfDoc.getPageCount(); i++) {
    const currentPaths = paths[i + 1]; // 현재 페이지의 경로 가져오기
    if (currentPaths) {
      const page = pdfDoc.getPage(i);
      const { width: pageWidth, height: pageHeight } = page.getSize();

      // 기존 주석 배열 먼저 가져오기
      // const existingAnnots = page.node.get(PDFName.of("Annots"));
      // const annotations: PDFDict[] = [];

      // currentPaths.forEach((path) => {
      //   const lineWidth = (path.lineWidth * pageWidth) / devicePixelRatio; // 정수값으로 변환
      //   // InkAnnotation 생성
      //   const annotation: PDFDict = pdfDoc.context.obj({
      //     Type: PDFName.of("Annot"),
      //     Subtype: PDFName.of("Ink"),
      //     F: 4, // 주석 플래그 (표시 필수)
      //     Rect: [
      //       (path.lastX * pageWidth) / devicePixelRatio,
      //       pageHeight - (path.lastY * pageHeight) / devicePixelRatio,
      //       (path.x * pageWidth) / devicePixelRatio,
      //       pageHeight - (path.y * pageHeight) / devicePixelRatio,
      //     ],
      //     InkList: [
      //       pdfDoc.context.obj([
      //         (path.lastX * pageWidth) / devicePixelRatio,
      //         pageHeight - (path.lastY * pageHeight) / devicePixelRatio,
      //         (path.x * pageWidth) / devicePixelRatio,
      //         pageHeight - (path.y * pageHeight) / devicePixelRatio,
      //       ]),
      //     ],
      //     C: [
      //       parseInt(path.color.slice(1, 3), 16) / 255,
      //       parseInt(path.color.slice(3, 5), 16) / 255,
      //       parseInt(path.color.slice(5, 7), 16) / 255,
      //     ],
      //     Border: [0, 0, lineWidth],
      //     BS: {
      //       // Border Style Dictionary 추가
      //       Type: PDFName.of("Border"),
      //       W: lineWidth, // 선 굵기
      //       S: PDFName.of("S"), // Solid 스타일
      //       LC: 1, // Line Cap Style: 1 = Round (0 = Butt, 2 = Square)
      //     },
      //     LE: [PDFName.of("Round"), PDFName.of("Round")], // Line Ending Styles
      //     Opacity: path.alpha,
      //     Contents: PDFString.of(
      //       JSON.stringify({ drawOrder: path.drawOrder + 1000 })
      //     ),
      //     T: "Ink Annotation", // 주석 제목
      //     CreationDate: new Date().toISOString(),
      //     M: new Date().toISOString(), // 수정 날짜
      //   });

      //   annotations.push(annotation);
      // });

      // // 한 번에 모든 주석 추가
      // if (existingAnnots instanceof PDFArray) {
      //   const annotationsArray = pdfDoc.context.obj([
      //     ...existingAnnots.array,
      //     ...annotations,
      //   ]);
      //   page.node.set(PDFName.of("Annots"), annotationsArray);
      // } else {
      //   page.node.set(PDFName.of("Annots"), pdfDoc.context.obj(annotations));
      // }

      //경로 그리기
      currentPaths.forEach(
        ({ x, y, lastX, lastY, color, lineWidth, alpha }) => {
          page.drawLine({
            start: {
              x: (lastX * pageWidth) / devicePixelRatio,
              y: pageHeight - (lastY * pageHeight) / devicePixelRatio,
            }, // y 좌표 반전
            end: {
              x: (x * pageWidth) / devicePixelRatio,
              y: pageHeight - (y * pageHeight) / devicePixelRatio,
            }, // y 좌표 반전
            color: colorToRGB(color), // 선 색상
            thickness: (lineWidth * pageWidth) / devicePixelRatio, // 선 두께
            lineCap: alpha === 1 ? LineCapStyle.Round : LineCapStyle.Butt,
            opacity: alpha,
          });
        }
      );
    }
  }
  if (!isMobile || __DEV__) {
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "modified.pdf");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  const base64DataUri = await pdfDoc.saveAsBase64();
  return base64DataUri;
};

export const convertAnnotationsToPaths = async (
  pdfBase64: string,
  pageSize: PageSize
) => {
  try {
    // annotation 데이터 가져오기
    const pdfData = atob(pdfBase64);
    const pdfBytes = new Uint8Array(pdfData.length);
    for (let i = 0; i < pdfData.length; i++) {
      pdfBytes[i] = pdfData.charCodeAt(i);
    }

    const loadingTask = pdfjs.getDocument({ data: pdfBytes });
    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;

    // 모든 페이지의 paths를 저장할 객체
    const allPaths: { [pageNumber: number]: PathsType[] } = {};

    // 각 페이지별로 annotation 변환
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const annotations = await page.getAnnotations();
      const convertedPaths: PathsType[] = [];
      annotations.forEach((annotation: any) => {
        if (annotation.subtype === "Ink") {
          const inkList = annotation.inkLists || [];

          inkList.forEach((points: number[]) => {
            for (let i = 0; i < points.length - 2; i += 2) {
              const path: PathsType = {
                lastX: (points[i] / pageSize.width) * devicePixelRatio,
                lastY:
                  ((pageSize.height - points[i + 1]) / pageSize.height) *
                  devicePixelRatio,
                x: (points[i + 2] / pageSize.width) * devicePixelRatio,
                y:
                  ((pageSize.height - points[i + 3]) / pageSize.height) *
                  devicePixelRatio,
                lineWidth:
                  ((annotation.borderStyle?.width || 1) / pageSize.width) *
                  devicePixelRatio,
                color: `#${annotation.color
                  ?.map((c: number) =>
                    Math.round(c * 255)
                      .toString(16)
                      .padStart(2, "0")
                  )
                  .join("")}` as (typeof colorMap)[number],
                drawOrder: JSON.parse(annotation.contentsObj.str).drawOrder,
                alpha: annotation.opacity || 1,
              };

              convertedPaths.push(path);
            }
          });
        }
      });

      // 현재 페이지의 paths 저장
      if (convertedPaths.length > 0) {
        allPaths[pageNum] = convertedPaths;
      }
    }

    // paths 객체 업데이트
    return allPaths;
  } catch (error) {
    console.error("Error converting annotations:", error);
  }
};

// export async function removeAnnots() {
//   const uint8Array = fs.readFileSync(importFilename);
//   const pdfDoc = await PDFDocument.load(uint8Array);
//   const pages = pdfDoc.getPages();

//   pages.forEach((page) => {
//     const annots = page.node.Annots();
//     const size = annots?.size();
//     if (size) {
//       for (let i = 0; i < size; i++) {
//         annots.context.delete(annots.get(i));
//       }
//     }
//   });

//   const pdfBytes = await pdfDoc.save();
//   fs.writeFileSync(exportFilename, pdfBytes);
// }

// export async function loadPDFAnnotations(base64Data: string) {
//   try {
//     // base64 데이터에서 PDF 문서 로드
//     const pdfDoc = await PDFDocument.load(base64Data);

//     // 페이지별 주석 데이터 저장할 배열
//     const annotationsData = [];

//     // 각 페이지의 주석 데이터 추출
//     for (let i = 0; i < pdfDoc.getPageCount(); i++) {
//       const page = pdfDoc.getPage(i);
//       const annotationsRef = page.node.get("Annots");
//       console.log(annotationsRef);
//       if (!annotationsRef) {
//         annotationsData.push([]); // 주석이 없는 페이지는 빈 배열 추가
//         continue;
//       }

//       const annotations =
//         annotationsRef instanceof PDFArray ? annotationsRef : null;

//       if (annotations) {
//         const annotArray = [];

//         for (const annot of annotations.asArray()) {
//           if (!annot) continue;

//           const annotDict = annot.dict;

//           const annotObj = {
//             type: annotDict?.get(PDFName.of("Subtype"))?.toString(),
//             color: annotDict
//               ?.get(PDFName.of("C"))
//               ?.asArray()
//               ?.map((c: any) => c.asNumber()),
//             coordinates: annotDict
//               ?.get(PDFName.of("InkList"))
//               ?.asArray()
//               ?.map((coord: any) =>
//                 coord.asArray().map((num: any) => num.asNumber())
//               ),
//             borderWidth: annotDict
//               ?.get(PDFName.of("Border"))
//               ?.asArray()?.[0]
//               ?.asNumber(),
//             opacity: annotDict?.get(PDFName.of("Opacity"))?.asNumber(),
//           };

//           if (annotObj.type) {
//             annotArray.push(annotObj);
//           }
//         }

//         annotationsData.push(annotArray);
//       } else {
//         annotationsData.push([]); // 주석이 없는 페이지는 빈 배열 추가
//       }
//     }

//     return annotationsData;
//   } catch (error) {
//     console.error("PDF 주석 로드 중 오류 발생:", error);
//     throw error;
//   }
// }