import React, { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export interface BarData {
  value?: number;
  label?: string;
  color?: string;
  id?: string | number;
  metadata?: unknown;
}

export interface BarConfig {
  barWidth: number;
  height: number;
  spacing?: number;
  minValue?: number;
  maxValue?: number;
  defaultColor?: string;
  colorScale?: (
    value: number | undefined,
    index: number,
    data: BarData,
  ) => string;
}

export interface RequiredBarConfig extends BarConfig {
  spacing: number;
  minValue: number;
  maxValue: number;
  defaultColor: string;
  colorScale?: (
    value: number | undefined,
    index: number,
    data: BarData,
  ) => string;
}

export interface SVGBarElement {
  rect: React.SVGProps<SVGRectElement>;
  data: BarData;
  index: number;
}

class SVGVerticalBarGenerator {
  private config: RequiredBarConfig;
  private data: BarData[];

  constructor(data: BarData[], config: BarConfig) {
    this.data = data;
    this.config = {
      spacing: 1,
      minValue: 0,
      maxValue: config.maxValue ?? Math.max(...data.map((d) => d.value ?? 0)),
      defaultColor: "#ffffff",
      colorScale: config.colorScale,
      ...config,
    };
  }

  getTotalWidth(): number {
    if (this.data.length === 0) return 0;
    const totalBars = this.data.length;
    const totalSpacing = (totalBars - 1) * this.config.spacing;
    return totalBars * this.config.barWidth + totalSpacing;
  }

  private getBarColor(
    value: number | undefined,
    index: number,
    data: BarData,
  ): string {
    if (data.color) return data.color;
    if (this.config.colorScale)
      return this.config.colorScale(value, index, data);
    return this.config.defaultColor;
  }

  generateBars(): SVGBarElement[] {
    return this.data.map((data, index) => {
      const x = index * (this.config.barWidth + this.config.spacing);

      const rect: React.SVGProps<SVGRectElement> = {
        x,
        y: 0,
        width: this.config.barWidth,
        height: this.config.height,
        fill: this.getBarColor(data.value, index, data),
        key: data.id ?? index,
      };

      return {
        rect,
        data,
        index,
      };
    });
  }

  getViewBox(): string {
    return `0 0 ${this.getTotalWidth()} ${this.config.height}`;
  }
}

interface SVGVerticalBarChartProps {
  data: BarData[];
  barWidth?: number;
  height?: number;
  spacing?: number;
  className?: string;
  align?: "left" | "center" | "right";
  specialBarStyle?: "diagonal-lines" | "dots" | "none";
  specialBarCondition?: (data: BarData, index: number) => boolean;
  onBarClick?: (data: BarData, index: number) => void;
  onBarHover?: (data: BarData, index: number) => void;
}

export function SVGVerticalBarChart({
  data,
  barWidth = 4,
  height = 100,
  spacing = 1,
  className = "",
  align = "center",
  specialBarStyle = "none",
  specialBarCondition,
  onBarClick,
  onBarHover,
}: SVGVerticalBarChartProps) {
  const isMobile = useIsMobile();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const generator = new SVGVerticalBarGenerator(data, {
    barWidth,
    height,
    spacing,
    defaultColor: "currentColor",
  });

  const bars = generator.generateBars();

  const handleBarClick = (barData: BarData, index: number) => {
    onBarClick?.(barData, index);
  };

  const handleBarHover = (barData: BarData, index: number) => {
    if (!isMobile) {
      onBarHover?.(barData, index);
    }
  };

  const handleMouseEnter = (index: number) => {
    if (!isMobile) {
      setHoveredIndex(index);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setHoveredIndex(null);
    }
  };

  const alignmentClass = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  }[align];

  return (
    <div className={`w-full flex ${alignmentClass} ${className}`}>
      <svg
        viewBox={generator.getViewBox()}
        className="h-auto"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: `${generator.getTotalWidth()}px` }}
      >
        <defs>
          <pattern
            id="diagonal-lines"
            patternUnits="userSpaceOnUse"
            width="6"
            height="6"
          >
            <rect width="6" height="6" fill="currentColor" />
            <line
              x1="0"
              y1="6"
              x2="6"
              y2="0"
              stroke="var(--background)"
              strokeWidth="1"
            />
          </pattern>
          <pattern id="dots" patternUnits="userSpaceOnUse" width="6" height="6">
            <rect width="6" height="6" fill="currentColor" />
            <circle cx="3" cy="3" r="1" fill="var(--background)" />
          </pattern>
        </defs>
        {bars.map(({ rect, data, index }) => {
          const { key, ...rectProps } = rect;
          const isSpecial = specialBarCondition?.(data, index) ?? false;

          let fill = rectProps.fill;
          if (isSpecial && specialBarStyle === "diagonal-lines") {
            fill = "url(#diagonal-lines)";
          } else if (isSpecial && specialBarStyle === "dots") {
            fill = "url(#dots)";
          }

          return (
            <rect
              key={key}
              {...rectProps}
              fill={fill}
              data-value={data.value ?? 0}
              data-label={data.label}
              data-index={index}
              className={`transition-opacity duration-200 ${
                hoveredIndex !== null && hoveredIndex !== index
                  ? "opacity-50"
                  : "opacity-100"
              } ${isMobile ? "cursor-pointer" : "hover:opacity-80 cursor-pointer"}`}
              onClick={() => handleBarClick(data, index)}
              onMouseEnter={() => {
                handleMouseEnter(index);
                handleBarHover(data, index);
              }}
              onMouseLeave={handleMouseLeave}
            />
          );
        })}
      </svg>
    </div>
  );
}
