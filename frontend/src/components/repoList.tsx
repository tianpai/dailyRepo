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
import { useRepoData } from "@/hooks/useRepoData.tsx";

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
  const { data, loading, error } = useRepoData("/trending");

  if (loading) return <div className="text-center">Loading…</div>;
  if (error)
    return <div className="text-center text-red-500">Error: {error}</div>;
  if (data.length === 0)
    return <div className="text-center">No repositories found.</div>;
  const trendingDate = new Date(data[0].trendingDate);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">
        {trendingDate.toLocaleDateString()}
      </h2>
      {data.map((repo: RepoData, i: number) => (
        <RepoCard key={repo.url} {...repo} rank={i + 1} />
      ))}
    </div>
  );
}

export function RepoCard({ rank, name, description, url }: RepoCardProps) {
  return (
    <Card className="flex flex-row items-center mx-10 my-4">
      <CardHeader className="flex flex-shrink-0 flex-row flex-grow-0 w-2/7">
        <p className="text-xl font-extrabold pr-5">{rank}</p>
        <div>
          <CardTitle className="flex flex-col">
            <p>{name}</p>
          </CardTitle>
          <CardDescription className="line-clamp-2">
            <p>{url}</p>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow w-1/2">{description}</CardContent>
      <CardFooter className=" justify-end-safe m-0 flex-shrink-0 flex-grow-0 w-3/13">
        {/* <RepoStats stars={stars} fork={forks} /> */}
      </CardFooter>
    </Card>
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
