"use client";

import { FC, useState } from "react";

interface FitContentProps {
  children: React.ReactNode;
  onResize: () => void;
}

const FitContent: FC<FitContentProps> = ({ children, onResize }) => {
  const [availableHeight, setAvailableHeight] = useState<
    number | null | undefined
  >(null);

  if (availableHeight === null) {
    return (
      <div
        ref={(element) => {
          if (!element) return;
          setAvailableHeight(element.parentElement?.clientHeight);
        }}></div>
    );
  }

  return (
    <div
      ref={(element) => {
        if (!element) return;

        let height = element.parentElement?.scrollHeight;

        if (height && availableHeight) {
          if (height > availableHeight) {
            onResize();
            setAvailableHeight(null);
          }
        }
      }}>
      {children}{" "}
    </div>
  );
};

export default FitContent;
