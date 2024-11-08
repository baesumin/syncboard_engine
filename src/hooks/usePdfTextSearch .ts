/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useState, useEffect, useCallback } from "react";
import { pdfjs } from "react-pdf";

interface SearchResult {
  pageNumber: number;
  indices: number[]; // 검색된 단어의 인덱스 위치들
  text: string; // 매칭된 텍스트
  matches: Array<{
    index: number;
    text: string;
  }>;
}

export const usePdfTextSearch = (file: string) => {
  const [pages, setPages] = useState<string[]>([]);

  // PDF 로딩 최적화
  const loadPdfPages = useCallback(async (file: string) => {
    try {
      const docData = await pdfjs.getDocument(
        `data:application/pdf;base64,${file}`
      ).promise;
      const pageCount = docData._pdfInfo.numPages;

      const pagePromises = Array.from({ length: pageCount }, async (_, i) => {
        const pageNum = i + 1;
        const page = await docData.getPage(pageNum);
        const textContent = await page.getTextContent();
        //@ts-ignore
        return textContent.items.map(({ str }) => str).join(" ");
      });

      const loadedPages = await Promise.all(pagePromises);
      setPages(loadedPages);
    } catch (error) {
      console.error("PDF 로딩 에러:", error);
    }
  }, []);

  useEffect(() => {
    if (file) {
      loadPdfPages(file);
    }
  }, [file, loadPdfPages]);

  const getSearchResult = (searchText: string) => {
    try {
      const regex = new RegExp(searchText, "gi");
      let globalIndex = 0;

      return pages.reduce<SearchResult[]>((results, text, pageIndex) => {
        const matches = Array.from(text.matchAll(regex));

        if (matches.length) {
          const pageMatches = matches.map((match) => ({
            index: match.index!,
            text: match[0],
          }));

          const indices = matches.map(() => globalIndex++);

          results.push({
            pageNumber: pageIndex + 1,
            indices,
            text,
            matches: pageMatches,
          });
        }
        return results;
      }, []);
    } catch (error) {
      console.error("검색 에러:", error);
      return [];
    }
  };

  return {
    getSearchResult,
  };
};
