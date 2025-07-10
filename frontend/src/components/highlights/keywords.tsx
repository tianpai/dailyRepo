import { useKeywords } from "@/hooks/repo-data";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface KeywordData {
  originalTopicsCount: number;
  topKeywords: string[];
  related?: Record<string, string[]>;
  clusterSizes?: {
    string: number;
  };
}

function KeywordsDisplay({
  data,
  loading,
  error,
  className,
}: {
  data: KeywordData;
  loading: boolean;
  error: string | null;
  className?: string;
}) {
  if (loading) {
    return <Skeleton className={`h-60 w-full ${className}`} />;
  }

  if (error) {
    return (
      <div className={`text-center text-red-500 ${className}`}>
        Error: Can't fetch keywords
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-2 p-2">
      <h2>Top Keywords: {data?.topKeywords?.length || 0}</h2>
      <div className="w-full">
        {data?.topKeywords?.map((keyword: string, index: number) => (
          <Badge className="m-1" key={index} variant="default">
            {keyword}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function KeywordsContainer({ className }: { className?: string }) {
  const { data, loading, error } = useKeywords();

  return (
    <KeywordsDisplay
      data={data}
      loading={loading}
      error={error}
      className={className}
    />
  );
}
