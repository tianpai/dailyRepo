import { useState } from "react";
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartPieDonut } from "@/components/repo/lang-pie-chart.tsx";
import { getOptimalForegroundColor } from "@/lib/fg-color.ts";
import { COLORS } from "@/lib/color";
import type { RepoProps } from "@/hooks/useTrendingRepos.tsx";

// Get color for a repository based on its index (matching star graph logic)
function getColor(index: number): string {
  const colorKeys = Object.keys(COLORS);
  const colorKey = colorKeys[index % colorKeys.length];
  return COLORS[colorKey as keyof typeof COLORS];
}

// Get random color from available colors
function getRandomColor(): string {
  const colorKeys = Object.keys(COLORS);
  const randomIndex = Math.floor(Math.random() * colorKeys.length);
  const colorKey = colorKeys[randomIndex];
  return COLORS[colorKey as keyof typeof COLORS];
}

export function RepoCard({
  owner,
  name,
  description,
  url,
  topics,
  language,
  colorIndex = 0,
}: RepoProps & { colorIndex?: number }) {
  const repoColor = getColor(colorIndex);
  return (
    <Card
      className="flex flex-col md:flex-row items-stretch mt-4"
      style={{ borderLeft: `4px solid ${repoColor}` }}
    >
      <CardHeader className="flex flex-shrink-0 flex-row flex-grow-0 w-full md:w-1/3">
        <div>
          <CardTitle className="flex flex-col">
            <RepoName owner={owner} name={name} url={url} />
          </CardTitle>
          <CardDescription>
            <RepoTopics topics={topics}></RepoTopics>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow w-full md:w-1/3 flex items-center">
        <div className="line-clamp-5">{description}</div>
      </CardContent>
      <CardFooter className="justify-center m-0 flex-shrink-0 flex-grow-0 w-full md:w-1/3 flex items-center p-4">
        <div className="w-full max-w-sm">
          <ChartPieDonut language={language} />
        </div>
      </CardFooter>
    </Card>
  );
}

export function RepoCardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-2xl font-bold">{children}</h1>
    </div>
  );
}

export function RepoTrendingDate({ children }: { children: React.ReactNode }) {
  return <p className="text-2xl font-bold mb-4">{children} </p>;
}

export function RepoTopics({ topics }: { topics: string[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayTopics = isExpanded ? topics : topics.slice(0, 5);
  const hasMoreTopics = topics.length > 5;

  return (
    <div className="flex flex-wrap gap-1 m-2">
      {displayTopics.map((topic, index) => {
        const bgColor = getRandomColor();
        const textColor = getOptimalForegroundColor(bgColor);
        return (
          <Badge
            key={index}
            variant="outline"
            className="px-3 py-1 border-1 transition-opacity"
            style={{ backgroundColor: bgColor, color: textColor }}
          >
            {topic}
          </Badge>
        );
      })}
      {hasMoreTopics && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          {isExpanded ? "Show less" : `+${topics.length - 5} more`}
        </button>
      )}
    </div>
  );
}

export function RepoName({
  owner,
  name,
  url,
}: {
  owner: string;
  name: string;
  url: string;
}) {
  return (
    <a href={url} rel="noopener noreferrer" target="_blank">
      {owner + "/" + name}
    </a>
  );
}
