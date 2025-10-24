import React from "react";
import { LoaderCircle } from "lucide-react";

const Spinner = ({ size = 24, text = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2 text-[var(--text-color-secondary)]">
      <LoaderCircle
        size={size}
        className="animate-spin text-[var(--primary-color)]"
      />
      {text && <span className="text-sm font-medium">{text}</span>}
    </div>
  );
};

export default Spinner;
