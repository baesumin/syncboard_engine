import { memo } from "react";

const PlaceholderPage = ({
  width,
  height,
}: {
  width: number;
  height: number;
}) => {
  return <div className="bg-white absolute" style={{ width, height }} />;
};

export default memo(PlaceholderPage);
