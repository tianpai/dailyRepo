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

// Hook for providing keyword data
function useKeywordData() {
  const { data, loading, error } = useKeywords();

  return {
    data,
    loading,
    error,
  };
}

// Presentational component for keywords
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
        Error: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 p-2">
      <div>Top Keywords: {data?.topKeywords?.length || 0}</div>
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

// Container component that combines data and presentation
export function KeywordsContainer({ className }: { className?: string }) {
  const { data, loading, error } = useKeywordData();

  return (
    <KeywordsDisplay
      data={data}
      loading={loading}
      error={error}
      className={className}
    />
  );
}
