import { Checked } from "../assets/icons";

interface props {
  onClick: () => void;
  color: string;
  isSelected?: boolean;
}

const ColorButton = ({ onClick, color, isSelected }: props) => {
  return (
    <div
      className="pointer-events-auto size-[44px] flex-center"
      onClick={onClick}
    >
      <div
        className="rounded-full size-[24px] flex-center"
        style={{ backgroundColor: color }}
      >
        {isSelected && <Checked color={"white"} />}
      </div>
    </div>
  );
};

export default ColorButton;
