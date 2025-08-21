import { useState, useEffect } from "react";

export function Loading({ className = "" }: { className?: string }) {
  const [activeBar, setActiveBar] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBar((prev) => (prev + 1) % 10);
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg width="120" height="20" viewBox="0 0 120 20">
        {Array.from({ length: 10 }, (_, index) => (
          <rect
            key={index}
            x={index * 12}
            y="0"
            width="8"
            height="20"
            className={
              index === activeBar ? "fill-description" : "fill-foreground/30"
            }
          />
        ))}
      </svg>
    </div>
  );
}
