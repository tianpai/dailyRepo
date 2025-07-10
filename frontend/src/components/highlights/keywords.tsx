import { useKeywords } from "@/hooks/repo-data";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { COLORS } from "@/lib/bg-color";

interface KeywordData {
  originalTopicsCount: number;
  topKeywords: string[];
  related?: Record<string, string[]>;
  clusterSizes?: {
    string: number;
  };
}
import { getOptimalForegroundColor } from "../../lib/fg-color.ts";

// Get color for a keyword based on its index
function getKeywordColor(index: number): string {
  const colorKeys = Object.keys(COLORS);
  const colorKey = colorKeys[index % colorKeys.length];
  return COLORS[colorKey as keyof typeof COLORS];
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
    <div className="rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-1">Top Keywords</h2>
        <p className="text-sm text-gray-400">
          {data?.topKeywords?.length || 0} trending topics
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {data?.topKeywords?.map((keyword: string, index: number) => {
          const bgColor = getKeywordColor(index);
          const textColor = getOptimalForegroundColor(bgColor);
          return (
            <Badge
              key={index}
              variant="outline"
              className="text-xs px-3 py-1 border-0 hover:opacity-80 transition-opacity"
              style={{ backgroundColor: bgColor, color: textColor }}
            >
              {keyword}
            </Badge>
          );
        })}
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
