import { useEffect } from "react";
import { useRepoDataContext } from "@/components/repo/repo-data-provider";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface PageRange {
  pages: (number | "ellipsis")[];
  showPrevEllipsis: boolean;
  showNextEllipsis: boolean;
}

function generatePageNumbers(
  currentPage: number,
  totalPages: number,
): PageRange {
  const delta = 2; // Number of pages to show on each side of current page
  const range: (number | "ellipsis")[] = [];

  if (totalPages <= 7) {
    // Show all pages if total is small
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

  return { pages: range, showPrevEllipsis: false, showNextEllipsis: false };
}

// Generic reusable pagination component
interface GenericPaginationProps {
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
}: GenericPaginationProps) {
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

  const { pages } = generatePageNumbers(currentPage, totalPages);

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

  return (
    <div className="flex justify-center mt-8 pb-15">
      <Pagination>
        <PaginationContent>
          {/* Previous Button */}
          <PaginationItem>
            <PaginationPrevious
              onClick={handlePrevious}
              className={
                !hasPrev ? "pointer-events-none opacity-50" : "cursor-pointer"
              }
            />
          </PaginationItem>

          {/* Page Numbers with inline ellipsis */}
          {pages.map((page, index) => (
            <PaginationItem key={index}>
              {page === "ellipsis" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={() => handlePageChange(page)}
                  isActive={page === currentPage}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          {/* Next Button */}
          <PaginationItem>
            <PaginationNext
              onClick={handleNext}
              className={
                !hasNext ? "pointer-events-none opacity-50" : "cursor-pointer"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
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
