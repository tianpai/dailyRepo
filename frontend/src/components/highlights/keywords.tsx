import { useKeywords } from "@/hooks/useKeywords";
import { MobilePopup } from "@/components/ui/mobile-popup";
import {
  SVGVerticalBarChart,
  type BarData,
} from "@/components/svg-vertical-bar-generator";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface HistoryBarData {
  id: number;
  label: string;
  metadata: { date: string; isToday: boolean };
}

function KeywordBadge({ keyword }: { keyword: string }) {
  const location = useLocation();
  const languageParam = new URLSearchParams(location.search).get("language") || "";
  const qp = new URLSearchParams();
  qp.set("q", keyword);
  if (languageParam) qp.set("language", languageParam);
  return (
    <Link to={`/search?${qp.toString()}`} className="px-2 py-0.5 border-1 transition-opacity border-border text-base text-foreground bg-background hover:opacity-70">
      {keyword}
    </Link>
  );
}

function KeywordsList({ keywords, loading }: { keywords: string[]; loading: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? keywords : keywords.slice(0, 12);
  return (
    <div className="w-full p-3">
      {loading ? (
        <div className="major-mono text-sm text-description">Loading...</div>
      ) : keywords && keywords.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2">
            {visible.map((keyword, index) => (
              <KeywordBadge key={index} keyword={keyword} />
            ))}
          </div>
          {keywords.length > 12 && (
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                className="major-mono text-[10px] px-2 py-0.5 inline-flex items-center gap-1 border-none"
                onClick={() => setExpanded((e) => !e)}
              >
                {expanded ? (
                  <>
                    <ChevronLeft className="w-3 h-3" /> LESS
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-3 h-3" /> MORE
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        <span className="major-mono text-sm text-description">No data</span>
      )}
    </div>
  );
}

function KeywordHistory({
  onDateSelect,
  selectedDate,
}: {
  onDateSelect: (date: string) => void;
  selectedDate: string | null;
}) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Generate past 7 days including today
  const past7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split("T")[0];
  });

  const historyData = past7Days.map((date, index) => ({
    id: index,
    label: date,
    metadata: { date, isToday: index === 6 },
  }));

  const handleBarClick = (data: BarData) => {
    const historyData = data as unknown as HistoryBarData;
    onDateSelect(historyData.metadata.date);
  };

  const handleBarHover = (data: BarData) => {
    const historyData = data as unknown as HistoryBarData;
    setHoveredDate(historyData.metadata.date);
  };

  const handleMouseLeave = () => {
    setHoveredDate(null);
  };

  const today = new Date().toISOString().split("T")[0];
  const displayDate = hoveredDate || selectedDate || today;

  return (
    <div className="flex flex-col items-center">
      <span className="major-mono text-xs text-foreground mb-1">
        {displayDate}
      </span>
      <div onMouseLeave={handleMouseLeave}>
        <SVGVerticalBarChart
          data={historyData}
          height={30}
          barWidth={10}
          spacing={2}
          className="w-16"
          specialBarStyle="diagonal-lines"
          specialBarCondition={(data: BarData) => {
            const historyData = data as unknown as HistoryBarData;
            const today = new Date().toISOString().split("T")[0];
            const currentSelectedDate = selectedDate || today;
            return historyData.metadata?.date === currentSelectedDate;
          }}
          onBarClick={handleBarClick}
          onBarHover={handleBarHover}
        />
      </div>
    </div>
  );
}

function KeywordsHeader({
  keywordCount,
  onDateSelect,
  selectedDate,
}: {
  keywordCount: number;
  onDateSelect: (date: string) => void;
  selectedDate: string | null;
}) {
  const helpText =
    "Keywords extracted from daily trending repositories. Updates everyday with the most popular topics.";

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
        <div className="flex items-center gap-2">
          <KeywordHistory
            onDateSelect={onDateSelect}
            selectedDate={selectedDate}
          />
          <MobilePopup content={helpText} popupWidth="w-64" />
        </div>
      </div>
    </div>
  );
}

export function KeywordsContainer({
  className,
}: {
  className?: string;
} = {}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Always call useKeywords with the selectedDate (or undefined for current)
  const {
    data: keywordData,
    loading: keywordLoading,
    error: keywordError,
  } = useKeywords(selectedDate || undefined);

  const displayData = keywordData;
  const displayLoading = keywordLoading;
  const displayError = keywordError;

  const handleDateSelect = (date: string) => {
    const today = new Date().toISOString().split("T")[0];
    if (date === today) {
      setSelectedDate(null); // Show current data for today
    } else {
      setSelectedDate(date);
    }
  };

  const renderStateMessage = (message: string) => (
    <div className="flex items-center justify-center h-full text-center p-4">
      <span className="major-mono text-lg text-foreground">{message}</span>
    </div>
  );

  return (
    <div
      className={`flex flex-col items-stretch justify-between mt-4 sm:mt-6 border-2 bg-background border-border text-foreground transition-all duration-200 ${className || ""}`}
    >
      <KeywordsHeader
        keywordCount={displayData?.topKeywords?.length || 0}
        onDateSelect={handleDateSelect}
        selectedDate={selectedDate}
      />
      {/* Stats bar: show more from the hook without overwhelming UI */}
      <div className="w-full px-3 py-2 border-b border-border">
        <div className="flex flex-wrap items-center gap-2">
          <span className="major-mono text-xs text-description">STATS:</span>
          <span className="major-mono text-xs px-2 py-0.5 border-1 border-border bg-background">
            TOTAL TOPICS: {displayData?.originalTopicsCount ?? 0}
          </span>
          <span className="major-mono text-xs px-2 py-0.5 border-1 border-border bg-background">
            SHOWN: {displayData?.topKeywords?.length ?? 0}
          </span>
        </div>
      </div>
      <div className="w-full flex flex-col items-start">
        {displayError ? (
          renderStateMessage("Error: Can't fetch keywords")
        ) : (
          <KeywordsList
            keywords={displayData?.topKeywords || []}
            loading={displayLoading}
          />
        )}
      </div>
    </div>
  );
}
