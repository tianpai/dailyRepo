import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getOptimalForegroundColor } from "@/lib/fg-color.ts";
import { COLORS } from "@/data/color";
import { useKeywords, type Keywords } from "@/hooks/useKeywords";

// Get color for a keyword based on its index
function getKeywordColor(index: number): string {
  const colorKeys = Object.keys(COLORS);
  const colorKey = colorKeys[index % colorKeys.length];
  return COLORS[colorKey as keyof typeof COLORS];
}

function KeywordBadge({ keyword, index }: { keyword: string; index: number }) {
  const bgColor = getKeywordColor(index);
  const textColor = getOptimalForegroundColor(bgColor);

  return (
    <Badge
      variant="outline"
      className="text-xs px-3 py-1 border-0 hover:opacity-80 transition-opacity"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {keyword}
    </Badge>
  );
}

function KeywordsList({
  keywords,
  loading,
}: {
  keywords: string[];
  loading: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {loading ? (
        <>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-6 w-20 rounded-full" />
          ))}
        </>
      ) : (
        keywords?.map((keyword, index) => (
          <KeywordBadge key={index} keyword={keyword} index={index} />
        ))
      )}
    </div>
  );
}

function KeywordsHeader({ keywordCount }: { keywordCount: number }) {
  return (
    <div>
      <h3 className="text-lg font-semibold">Top Keywords</h3>
      <p className="text-sm text-gray-400">{keywordCount} trending topics</p>
    </div>
  );
}

function KeywordsDisplay({
  data,
  loading,
  error,
  className,
}: {
  data: Keywords;
  loading: boolean;
  error: string | null;
  className?: string;
}) {
  const renderStateMessage = (message: string) => (
    <div className="flex items-center justify-center h-full text-center text-red-500">
      {message}
    </div>
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <KeywordsHeader keywordCount={data?.topKeywords?.length || 0} />
      </CardHeader>
      <CardContent>
        {error ? (
          renderStateMessage("Error: Can't fetch keywords")
        ) : (
          <KeywordsList keywords={data?.topKeywords || []} loading={loading} />
        )}
      </CardContent>
    </Card>
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
