import { useRepoDataContext } from "@/components/repo/repo-data-provider";
import { RepoPagination } from "@/components/repo/repo-pagination";
import { RepoCard } from "./repo-card";

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
    <div>
      <h1 className="text-2xl font-bold mb-4">Daily Trending</h1>
      {data.map((repo) => (
        <RepoCard
          key={repo.url}
          owner={repo.owner}
          name={repo.name}
          description={repo.description}
          url={repo.url}
          topics={repo.topics}
          language={repo.language}
          trendingRecord={repo.trendingRecord}
          license={repo.license}
          createdAt={repo.createdAt}
        />
      ))}
      <RepoPagination />
    </div>
  );
}
