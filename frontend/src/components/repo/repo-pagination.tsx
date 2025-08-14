import { useEffect, useState } from "react";
import { useRepoDataContext } from "@/components/repo/repo-data-provider";
import type { ReactElement } from "react";

interface PageRange {
  pages: (number | "ellipsis")[];
  showPrevEllipsis: boolean;
  showNextEllipsis: boolean;
}

function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  isSmallScreen: boolean = false,
): PageRange {
  const range: (number | "ellipsis")[] = [];

  if (isSmallScreen) {
    if (totalPages <= 4) {
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      if (currentPage <= 2) {
        range.push(1);
        range.push(2);
        if (totalPages > 3) {
          range.push("ellipsis");
          range.push(totalPages);
        } else {
          range.push(3);
        }
      } else if (currentPage >= totalPages - 1) {
        range.push(1);
        range.push("ellipsis");
        range.push(totalPages - 1);
        range.push(totalPages);
      } else {
        range.push(1);
        range.push("ellipsis");
        range.push(totalPages);
      }
    }
  } else {
    const delta = 2;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      // Always show first page
      range.push(1);

      // Calculate start and end of middle range
      const start = Math.max(2, currentPage - delta);
      const end = Math.min(totalPages - 1, currentPage + delta);

      // Add ellipsis before middle range if needed
      if (start > 2) {
        range.push("ellipsis");
      }

      // Add middle range
      for (let i = start; i <= end; i++) {
        range.push(i);
      }

      // Add ellipsis after middle range if needed
      if (end < totalPages - 1) {
        range.push("ellipsis");
      }

      // Always show last page
      if (totalPages > 1) {
        range.push(totalPages);
      }
    }
  }

  return { pages: range, showPrevEllipsis: false, showNextEllipsis: false };
}

// Hook to get screen width
function useScreenWidth() {
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 768,
  );

  useEffect(() => {
    function handleResize() {
      setScreenWidth(window.innerWidth);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return screenWidth;
}

// Dynamic ellipsis based on screen width
function getDynamicEllipsis(screenWidth: number): string {
  if (screenWidth <= 440) return "///"; // Small screens
  return "/////////"; // Larger screens
}

// ASCII Pagination Component
interface AsciiPaginationProps {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}

export function GenericPagination({
  currentPage,
  totalPages,
  hasNext,
  hasPrev,
  isLoading = false,
  onPageChange,
}: AsciiPaginationProps) {
  const screenWidth = useScreenWidth();

  // Scroll to top when page changes and not loading
  useEffect(() => {
    if (!isLoading) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
  }, [currentPage, isLoading]);

  // Don't render if no pagination data, loading, or only one page
  if (isLoading || totalPages <= 1) {
    return null;
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handlePrevious = () => {
    if (hasPrev) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      handlePageChange(currentPage + 1);
    }
  };

  const isSmallScreen = screenWidth <= 440;
  const { pages } = generatePageNumbers(currentPage, totalPages, isSmallScreen);

  // Split the ASCII string into clickable segments
  const renderClickablePagination = () => {
    const segments: ReactElement[] = [];

    // Left bracket and previous arrow
    segments.push(
      <span key="bracket-left" className="text-foreground">
        [
      </span>,
    );

    segments.push(
      <span
        key="prev"
        className={`cursor-pointer ${hasPrev ? "text-foreground hover:text-primary" : "text-muted-foreground"}`}
        onClick={handlePrevious}
      >
        {hasPrev ? "<-" : "  "}
      </span>,
    );

    segments.push(
      <span key="pipe-start" className="text-foreground">
        |
      </span>,
    );

    // Page numbers
    pages.forEach((page, index) => {
      if (page === "ellipsis") {
        segments.push(
          <span key={`ellipsis-${index}`} className="text-muted-foreground">
            {getDynamicEllipsis(screenWidth)}
          </span>,
        );
      } else {
        const isActive = page === currentPage;
        segments.push(
          <span
            key={`page-${page}`}
            className={`cursor-pointer ${
              isActive
                ? "text-primary font-bold"
                : "text-foreground hover:text-primary"
            }`}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </span>,
        );
      }

      // Add pipe separator after each element except the last
      if (index < pages.length - 1) {
        segments.push(
          <span key={`pipe-${index}`} className="text-foreground">
            |
          </span>,
        );
      }
    });

    // Pipe before next arrow
    segments.push(
      <span key="pipe-end" className="text-foreground">
        |
      </span>,
    );

    // Next arrow
    segments.push(
      <span
        key="next"
        className={`cursor-pointer ${hasNext ? "text-foreground hover:text-primary" : "text-muted-foreground"}`}
        onClick={handleNext}
      >
        {hasNext ? "->" : "  "}
      </span>,
    );

    // Right bracket
    segments.push(
      <span key="bracket-right" className="text-foreground">
        ]
      </span>,
    );

    return segments;
  };

  const clickableSegments = renderClickablePagination();

  return (
    <div className="flex justify-center mt-8 pb-15">
      <div className="major-mono text-lg bg-background text-foreground">
        {clickableSegments.map((segment, index) => (
          <span key={index}>
            {segment}
            {index < clickableSegments.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

export function RepoPagination() {
  const { currentPage, setCurrentPage, pagination, loading } =
    useRepoDataContext();

  if (!pagination) {
    return null;
  }

  return (
    <GenericPagination
      currentPage={currentPage}
      totalPages={pagination.totalPages}
      hasNext={pagination.hasNext}
      hasPrev={pagination.hasPrev}
      isLoading={loading}
      onPageChange={setCurrentPage}
    />
  );
}
