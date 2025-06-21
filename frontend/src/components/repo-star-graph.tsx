/**
 * TODO:
 * 1. Add a graph showing the number of stars over time for all repos trending
 *    that date
 *    - [ ] a list of repos trending that date
 *    - [ ] fetch star history for each repo
 *    - [ ] display every single data point
 *    - [ ] use least squares regression to show a trend line
 */
import { useRepoDataContext } from "@/context/repo-data-provider";
import { useStarHistory } from "@/hooks/repo-data";

export function RepoStarGraph() {
  const { data: repoData } = useRepoDataContext();
  const names = repoData.map((repo) => repo.owner + "/" + repo.name) || [];
  const { data: starHistory, loading, error } = useStarHistory(names[0]);

  if (loading) return <div>Loading star history...</div>;
  if (error)
    return <div className="text-red-500">Error: fetching star history</div>;

  return <div className="text-2xl">{starHistory.toString()}</div>;
}
