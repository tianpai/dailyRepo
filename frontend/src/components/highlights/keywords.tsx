import { Skeleton } from "@/components/ui/skeleton";
import { useKeywords, type Keywords } from "@/hooks/useKeywords";
import { CircleHelp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function KeywordBadge({ keyword }: { keyword: string }) {
  return (
    <span className="px-3 py-1 border-1 transition-opacity border-border major-mono text-lg text-foreground bg-background hover:opacity-70">
      {keyword}
    </span>
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
    <div className="flex flex-wrap gap-1 m-2 w-full">
      {loading ? (
        <>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-20" />
          ))}
        </>
      ) : (
        keywords?.map((keyword, index) => (
          <KeywordBadge key={index} keyword={keyword} />
        ))
      )}
    </div>
  );
}

function KeywordsHeader({ keywordCount }: { keywordCount: number }) {
  return (
    <div className="p-4 border-b-2 border-border">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="major-mono text-lg font-normal text-foreground">
            TOP KEYWORDS
          </h3>
          <p className="major-mono text-sm text-description mt-1">
            {keywordCount} trending topics
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <CircleHelp className="w-5 h-5 text-description hover:text-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Keywords extracted from daily trending repositories. Updates everyday with the most popular topics.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
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
    <div className="flex items-center justify-center h-full text-center p-4">
      <span className="major-mono text-lg text-foreground">{message}</span>
    </div>
  );

  return (
    <div className={`flex flex-col items-stretch justify-between mt-4 sm:mt-6 border-2 bg-background border-border text-foreground transition-all duration-200 ${className || ""}`}>
      <KeywordsHeader keywordCount={data?.topKeywords?.length || 0} />
      <div className="w-full flex flex-col items-start">
        {error ? (
          renderStateMessage("Error: Can't fetch keywords")
        ) : (
          <KeywordsList keywords={data?.topKeywords || []} loading={loading} />
        )}
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
