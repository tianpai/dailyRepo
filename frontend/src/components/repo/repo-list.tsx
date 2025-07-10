import { GoRepoForked } from "react-icons/go";
import { FaRegStar } from "react-icons/fa6";
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useRepoDataContext } from "@/context/repo-data-provider";
import { ChartPieDonut } from "@/components/repo/lang-pie-chart.tsx";
import { lazy, Suspense } from "react";

const RepoStarGraph = lazy(() =>
  import("@/components/repo/repo-star-graph.tsx").then((module) => ({
    default: module.RepoStarGraph,
  })),
);
import { RepoDatePicker } from "@/components/date-picker.tsx";
import { RepoPagination } from "@/components/repo/repo-pagination";

import type {
  StatsProps,
  RepoCardProps,
  RepoData,
} from "@/interface/repository.tsx";

// Color palette matching the star history graph
const REPO_COLORS = {
  color1: "#FF6B6B",
  color2: "#4ECDC4",
  color3: "#45B7D1",
  color4: "#96CEB4",
  color5: "#FFEAA7",
  color6: "#DDA0DD",
  color7: "#98D8C8",
  color8: "#F7DC6F",
  color9: "#BB8FCE",
  color10: "#85C1E9",
  color11: "#F8C471",
  color12: "#82E0AA",
  color13: "#F1948A",
  color14: "#85C1E9",
  color15: "#F8D7DA",
  color16: "#D5DBDB",
  color17: "#A3E4D7",
  color18: "#D7BDE2",
  color19: "#A9DFBF",
  color20: "#F9E79F",
  color21: "#AED6F1",
  color22: "#F5B7B1",
  color23: "#A2D9CE",
  color24: "#E8DAEF",
  color25: "#FADBD8",
  color26: "#D0ECE7",
  color27: "#FCF3CF",
  color28: "#EBDEF0",
  color29: "#D6EAF8",
  color30: "#EDBB99",
};

// Get color for a repository based on its index (matching star graph logic)
function getRepoColor(index: number): string {
  const colorKeys = Object.keys(REPO_COLORS);
  const colorKey = colorKeys[index % colorKeys.length];
  return REPO_COLORS[colorKey as keyof typeof REPO_COLORS];
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    const formatted = (num / 1000).toFixed(1);
    return formatted.endsWith(".0")
      ? `${formatted.slice(0, -2)}k`
      : `${formatted}k`;
  }
  return num.toString();
}

export function RepoList() {
  const { data, loading, error, currentPage, pagination } =
    useRepoDataContext();
  if (loading)
    return (
      <div className="text-center">
        Loading…(initial load might take 20 seconds)
      </div>
    );
  if (error)
    return <div className="text-center text-red-500">Error: {error}</div>;
  if (data.length === 0)
    return <div className="text-center">No repositories found.</div>;
  const limit = pagination?.limit || 15;
  const startRank = (currentPage - 1) * limit;

  return (
    <div>
      <RepoDatePicker></RepoDatePicker>
      <h2 className="text-2xl font-bold mb-4">Daily Highlight</h2>
      <Suspense
        fallback={<div className="h-96 bg-gray-100 rounded-lg animate-pulse" />}
      >
        <RepoStarGraph />
      </Suspense>
      {data.map((repo: RepoData, i: number) => (
        <RepoCard
          key={repo.url}
          {...repo}
          rank={startRank + i + 1}
          colorIndex={i}
        />
      ))}
      <RepoPagination />
    </div>
  );
}

export function RepoCard({
  rank,
  owner,
  name,
  description,
  url,
  topics,
  language,
  colorIndex = 0,
}: RepoCardProps & { colorIndex?: number }) {
  const repoColor = getRepoColor(colorIndex);
  return (
    <Card
      className="flex flex-col md:flex-row items-stretch mt-4"
      style={{ borderLeft: `4px solid ${repoColor}` }}
    >
      <CardHeader className="flex flex-shrink-0 flex-row flex-grow-0 w-full md:w-1/3">
        <p className="text-xl font-extrabold pr-5">{rank}</p>
        <div>
          <CardTitle className="flex flex-col">
            <RepoName owner={owner} name={name} url={url} />
          </CardTitle>
          <CardDescription className="line-clamp-2">
            <RepoTopics topics={topics}></RepoTopics>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow w-full md:w-1/3 flex items-center">
        {description}
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
  return <div>{topics.slice(0, 5).join(" ")}</div>;
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

export function RepoStats({ stars, fork }: StatsProps) {
  return (
    <div className="flex items-center space-x-5 text-sm font-medium text-gray-700">
      <span className="flex items-center">
        <FaRegStar className="mr-1 p-0 text-yellow-500" />
        <span className="tabular-nums min-w-[2.5rem] text-right">
          {formatNumber(stars)}
        </span>
      </span>
      <span className="flex items-center">
        <GoRepoForked className="mr-0 p-0 text-purple-500" />
        <span className="tabular-nums min-w-[2.5rem] text-right">
          {formatNumber(fork)}
        </span>
      </span>
    </div>
  );
}
