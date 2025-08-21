import { useKeywords } from "@/hooks/useKeywords";
import { MobilePopup } from "@/components/ui/mobile-popup";
import {
  SVGVerticalBarChart,
  type BarData,
} from "@/components/svg-vertical-bar-generator";
import { useState } from "react";

interface HistoryBarData {
  id: number;
  label: string;
  metadata: { date: string; isToday: boolean };
}

function KeywordBadge({ keyword }: { keyword: string }) {
  return (
    <span className="px-3 py-1 border-1 transition-opacity border-border major-mono text-lg text-foreground bg-background hover:opacity-70">
      {keyword}
    </span>
  );
}

function KeywordsList({ keywords }: { keywords: string[]; loading: boolean }) {
  return (
    <div className="flex flex-wrap gap-1 m-2 w-full">
      {keywords && keywords.length > 0 ? (
        keywords.map((keyword, index) => (
          <KeywordBadge key={index} keyword={keyword} />
        ))
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
