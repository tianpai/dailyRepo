import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { MobilePopup } from "@/components/ui/mobile-popup";
import {
  TrendingUp,
  Scale,
  Cake,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import emojiRegex from "emoji-regex";
import { RepoLanguage } from "@/components/repo/repo-language.tsx";
import type { RepoProps } from "@/hooks/useTrendingRepos.tsx";
import { TiltedWrapper } from "@/components/ui/tilted-wrapper";

const RepoCardContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col items-stretch justify-between mt-4 sm:mt-6 border-2 bg-background border-border text-foreground transition-all duration-200">
    {children}
  </div>
);

const RepoCardFooter = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full flex flex-col items-start">{children}</div>
);

const RepoCardTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="flex text-foreground mb-2 lg:mb-0">{children}</div>
);

function removeEmojis(text: string | null | undefined): string {
  if (!text) {
    return "";
  }
  return text.replace(emojiRegex(), "").trim();
}

function RepoTopics({ topics }: { topics: string[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayTopics = isExpanded ? topics : topics.slice(0, 5);
  const hasMoreTopics = topics.length > 5;

  return (
    <div className="flex flex-wrap gap-1 m-2 w-full">
      {displayTopics.map((topic, index) => {
        return (
          <Link key={index} to={`/search?q=${encodeURIComponent(topic)}`} className="inline-block">
            <Badge
              variant="outline"
              className="px-3 py-1 border-1 transition-opacity rounded-none major-mono text-lg text-description hover:opacity-80"
            >
              {topic}
            </Badge>
          </Link>
        );
      })}
      {hasMoreTopics && (
        <div className="flex-grow flex justify-end">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 major-mono text-lg text-description hover:opacity-70 transition-opacity inline-flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                <ChevronLeft className="w-4 h-4" />
              </>
            ) : (
              <>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function RepoName({
  owner,
  name,
  url,
}: {
  owner: string;
  name: string;
  url: string;
}) {
  return (
    <a
      href={url}
      rel="noopener noreferrer"
      target="_blank"
      className="major-mono text-lg font-normal"
    >
      {owner + "/" + name}
    </a>
  );
}

function TrendingHistory({ trendingRecord }: { trendingRecord: string[] }) {
  if (!trendingRecord || trendingRecord.length === 0) {
    return null;
  }

  const trendingCount = trendingRecord.length;
  const sortedDates = [...trendingRecord].sort((a, b) => b.localeCompare(a));
  const displayDates = sortedDates.slice(0, 3);
  const hasMoreDates = sortedDates.length > 3;

  const tooltipContent = `Previously trending ${trendingCount} time${trendingCount > 1 ? "s" : ""} on ${displayDates.join(", ")}${hasMoreDates ? ` and ${sortedDates.length - 3} more dates` : ""}`;

  return (
    <MobilePopup
      content={tooltipContent}
      popupWidth="w-64"
      trigger={
        <span className="major-mono text-lg text-foreground inline-flex items-center gap-1">
          <TrendingUp className="w-4 h-4" />
          {trendingCount}
        </span>
      }
    />
  );
}

function RepoLicense({ license }: { license: string }) {
  if (!license) {
    return null;
  }

  return (
    <span className="major-mono text-lg text-foreground inline-flex items-center gap-1">
      <Scale className="w-4 h-4" />
      {license}
    </span>
  );
}

function RepoBirthday({ createdAt }: { createdAt: string }) {
  if (!createdAt) {
    return null;
  }

  const calculateAge = (dateStr: string) => {
    const createdDate = new Date(dateStr);
    const now = new Date();

    const totalDays = Math.floor(
      (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Adjust for leap years and get remaining days after full years
    const years = Math.floor(totalDays / 365.25);
    const remainingDays = Math.floor(totalDays - years * 365.25);

    return { years, days: remainingDays };
  };

  const age = calculateAge(createdAt);
  const ageText = `${age.years} year${age.years !== 1 ? "s" : ""}, ${age.days} day${age.days !== 1 ? "s" : ""}`;

  return (
    <MobilePopup
      content={ageText}
      popupWidth="w-56"
      trigger={
        <span className="major-mono text-lg text-foreground inline-flex items-center gap-1">
          <Cake className="w-4 h-4" />
          {createdAt}
        </span>
      }
    />
  );
}

export function RepoCard({
  owner,
  name,
  description,
  url,
  topics,
  language,
  trendingRecord,
  license,
  createdAt,
}: RepoProps) {
  return (
    <TiltedWrapper>
      <RepoCardContainer>
        <div className="flex flex-col flex-grow border-b-2 border-border p-4 sm:p-6 lg:p-10">
          {/* Repo Name - Always on top */}
          <div className="w-full mb-3">
            <RepoCardTitle>
              <RepoName owner={owner} name={name} url={url} />
            </RepoCardTitle>
          </div>

          {/* Description - Always below repo name */}
          <div className="w-full">
            <div className="line-clamp-3 sm:line-clamp-4 lg:line-clamp-5 major-mono text-base sm:text-lg text-description leading-relaxed">
              {removeEmojis(description)}
            </div>
          </div>
        </div>
        <RepoCardFooter>
          <RepoLanguage language={language} />
          <div className="px-4 py-2 flex flex-col sm:flex-row sm:justify-between sm:items-center w-full gap-3 sm:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              <TrendingHistory trendingRecord={trendingRecord} />
              <RepoBirthday createdAt={createdAt} />
            </div>
            <RepoLicense license={license} />
          </div>
          <div className="px-4 py-2">
            <RepoTopics topics={topics} />
          </div>
        </RepoCardFooter>
      </RepoCardContainer>
    </TiltedWrapper>
  );
}
