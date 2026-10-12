import { Info } from "lucide-react";

const GITHUB_STARGAZER_RESTRICTIONS_URL =
  "https://github.blog/changelog/2026-06-30-upcoming-access-restrictions-to-public-api-endpoints-and-ui-views/";

export function HistoricalStarDataNotice() {
  return (
    <div
      role="note"
      className="mb-3 flex w-full items-start gap-2 border border-border bg-background px-3 py-2 text-description"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p className="major-mono text-xs leading-relaxed sm:text-sm">
        <span className="text-foreground">Historical star data:</span> GitHub
        restricted its stargazers API to repository admins and collaborators in
        July 2026. Authentication alone no longer grants access, so these charts
        use previously collected data. {" "}
        <a
          href={GITHUB_STARGAZER_RESTRICTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline underline-offset-2 hover:opacity-70"
        >
          Official announcement
        </a>
      </p>
    </div>
  );
}
