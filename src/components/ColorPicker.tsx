import { colorMap } from "../libs/utils/common";
import ColorButton from "./ColorButton";

interface Props {
  onColorSelect: (
    color: "#202325" | "#007AFF" | "#54B41D" | "#FFBB00" | "#F34A47"
  ) => void;
  selectedColor: "#202325" | "#007AFF" | "#54B41D" | "#FFBB00" | "#F34A47";
}

const ColorPicker = ({ onColorSelect, selectedColor }: Props) => {
  return (
    <div className="flex flex-row w-[220px] justify-between">
      {colorMap.map((color) => (
        <ColorButton
          key={color}
          color={color}
          isSelected={color === selectedColor}
          onClick={() => onColorSelect(color)}
        />
      ))}
    </div>
  );
};

export default ColorPicker;
