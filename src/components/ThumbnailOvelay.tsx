import clsx from "clsx";
import { Close } from "../assets/icons";
import { Thumbnail } from "react-pdf";
import { useAtom } from "jotai";
import { pdfStateAtom } from "../store/pdf";
import { PathsType } from "../types/common";
import { useCallback, useEffect, useRef } from "react";
import { reDrawPathGroup } from "../utils/common";

const ThumbnailOvelay = ({
  paths,
}: {
  paths: {
    [pageNumber: number]: PathsType[];
  };
}) => {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [pdfState, setPdfState] = useAtom(pdfStateAtom);

  const redrawPaths = useCallback(
    (pageNumber: number) => {
      if (!canvasRefs.current[pageNumber] || !paths[pageNumber]) return;
      const matches =
        canvasRefs.current[pageNumber].style.height.match(/[\d.]+/);
      if (matches) {
        canvasRefs.current[pageNumber].width = 180 * 2;
        canvasRefs.current[pageNumber].height = parseFloat(matches[0]) * 2;
        const points = paths[pageNumber];
        if (!points || points.length === 0) return;
        const context = canvasRefs.current[pageNumber].getContext("2d")!;
        context.clearRect(
          0,
          0,
          canvasRefs.current[pageNumber].width,
          canvasRefs.current[pageNumber].height
        );
        let currentGroup: PathsType[] = [];

        if (points.length === 1) return;

        let currentStyle = {
          color: points[1].color,
          lineWidth: points[1].lineWidth,
          alpha: points[1].alpha,
        };

        for (let i = 1; i < points.length; i++) {
          // 선이 이어진 경우
          if (
            points[i].lastX === points[i - 1].x &&
            points[i].lastY === points[i - 1].y
          ) {
            if (i === 1) currentGroup.push(points[0]);
            currentGroup.push(points[i]);
            continue;
          }

          // 선이 띄워진 경우
          if (currentGroup.length) {
            context.beginPath();

            // 현재 그룹이 2개 이상의 점을 포함하면 선 그리기
            reDrawPathGroup(
              context,
              currentGroup,
              currentStyle,
              180,
              parseFloat(matches[0])
            );
          }

          // 단일 점 처리
          currentGroup = [points[i]]; // 새로운 그룹 초기화
          currentStyle = {
            color: points[i].color,
            lineWidth: points[i].lineWidth,
            alpha: points[i].alpha,
          };
        }
        // 마지막 그룹 처리
        if (currentGroup.length) {
          context.beginPath();

          reDrawPathGroup(
            context,
            currentGroup,
            currentStyle,
            180,
            parseFloat(matches[0])
          );
        }
      }
    },
    [paths]
  );

  useEffect(() => {
    if (pdfState.isListOpen) {
      Object.keys(paths)
        .map(Number)
        .forEach((pageNumber) => {
          redrawPaths(pageNumber);
        });
    }
  }, [paths, pdfState.isListOpen, redrawPaths]);

  return (
    <div
      className={clsx(
        "absolute top-0 left-0 bottom-0 right-0 overflow-auto bg-black/70 px-[20px] pt-[24px] z-[9999]",
        pdfState.isListOpen ? "" : "hidden"
      )}
    >
      <div className="flex justify-end items-center">
        <button
          onClick={() => {
            setPdfState({
              ...pdfState,
              isListOpen: false,
            });
          }}
          className="bg-white size-[44px] flex-center rounded-xl"
        >
          <Close />
        </button>
      </div>
      <div
        className="grid mt-[20px] gap-y-5"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        }}
      >
        {[...new Array(pdfState.totalPage)].map((_, index) => {
          return (
            <div key={index} className="w-[180px]">
              <div
                className={clsx(
                  pdfState.pageNumber === index + 1
                    ? "border-[3px] border-[#FF9A51]"
                    : "",
                  "overflow-hidden h-[232px] relative"
                )}
              >
                <Thumbnail
                  pageNumber={index + 1}
                  width={180}
                  devicePixelRatio={2}
                  onItemClick={({ pageNumber }) => {
                    setPdfState({
                      ...pdfState,
                      pageNumber: pageNumber,
                      isListOpen: false,
                    });
                  }}
                  loading={<></>}
                  className="absolute"
                />
                <canvas
                  ref={(el) => {
                    canvasRefs.current[index + 1] = el;
                  }}
                  style={{
                    width: 180,
                    height: 232,
                  }}
                  className="absolute pointer-events-none"
                />
              </div>
              <div className="h-[31px] flex justify-center items-center">
                <span
                  className={
                    pdfState.pageNumber === index + 1
                      ? "text-[#FF9A51] font-bold text-lg"
                      : "text-white"
                  }
                >
                  {index + 1}/{pdfState.totalPage}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ThumbnailOvelay;
