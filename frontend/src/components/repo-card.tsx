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

interface StatsProps {
  stars: number;
  fork: number;
}

interface RepoCardProps {
  rank: number;
  name: string;
  description: string;
  summary: string;
  stars: number;
  forks: number;
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

export function RepoCard({
  rank,
  name,
  description,
  summary,
  stars,
  forks,
}: RepoCardProps) {
  return (
    <Card className="flex flex-row items-center mx-10 my-4">
      <CardHeader className="flex flex-shrink-0 flex-row flex-grow-0 w-2/7">
        <p className="text-xl font-extrabold pr-5">{rank}</p>
        <div>
          <CardTitle className="flex flex-col">
            <p>{name}</p>
          </CardTitle>
          <CardDescription className="line-clamp-2">
            <p>{description}</p>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow w-1/2">{summary}</CardContent>
      <CardFooter className=" justify-end-safe m-0 flex-shrink-0 flex-grow-0 w-3/13">
        <RepoStats stars={stars} fork={forks} />
      </CardFooter>
    </Card>
  );
}
