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
import { ChartPieDonut } from "@/components/lang-pie-chart.tsx";
import { RepoStarGraph } from "@/components/repo-star-graph.tsx";
import { RepoDatePicker } from "@/components/date-picker.tsx";

import type {
  StatsProps,
  RepoCardProps,
  RepoData,
} from "@/interface/repository.tsx";

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
  const { data, loading, error } = useRepoDataContext();
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
  return (
    <div className="">
      <RepoDatePicker></RepoDatePicker>
      <RepoStarGraph></RepoStarGraph>
      {data.map((repo: RepoData, i: number) => (
        <RepoCard key={repo.url} {...repo} rank={i + 1} />
      ))}
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
}: RepoCardProps) {
  return (
    <Card className="flex flex-col md:flex-row items-center mt-4">
      <CardHeader className="flex flex-shrink-0 flex-row flex-grow-0 w-full md:w-2/7">
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
      <CardContent className="flex-grow w-full md:w-1/2">
        {description}
      </CardContent>
      <CardFooter className="justify-end-safe m-0 flex-shrink-0 flex-grow-0 w-full md:w-3/13 flex items-center">
        <div className="w-full md:w-auto">
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
