import { useState, useEffect } from "react";
import { PageContainer } from "@/components/page-container";
import { SidebarLayout } from "@/components/app-sidebar";
import { useTrendingDevelopers } from "@/hooks/developer-data";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import type { DeveloperData, PaginationMetadata } from "@/interface/developer";

export function DeveloperPage() {
  return (
    <PageContainer>
      <SidebarLayout>
        <DeveloperPageContent />
      </SidebarLayout>
    </PageContainer>
  );
}

function DeveloperPageContent() {
  const [currentPage, setCurrentPage] = useState(1);
  const { data, pagination, loading, error } = useTrendingDevelopers(
    undefined,
    currentPage,
  );

  if (loading) return <p>Loading developers...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-6">
      <DeveloperPageHeader total={pagination?.total || 0} />
      <DeveloperGrid developers={data} />
      <DeveloperPagination
        currentPage={currentPage}
        pagination={pagination}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

function DeveloperPageHeader({ total }: { total: number }) {
  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Trending Developers</h1>
      <p className="mb-6">Total: {total} developers</p>
    </>
  );
}

function DeveloperGrid({ developers }: { developers: DeveloperData[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {developers.map((dev) => (
        <DeveloperCard key={dev.username} developer={dev} />
      ))}
    </div>
  );
}

function DeveloperCard({ developer }: { developer: DeveloperData }) {
  return (
    <Card className="flex flex-col items-center text-center">
      <CardContent className="flex flex-col items-center space-y-3 w-full">
        <DeveloperName developer={developer} />
        <DeveloperAvatar developer={developer} />
        <DeveloperRepository developer={developer} />
        <DeveloperLocation developer={developer} />
      </CardContent>
    </Card>
  );
}

function DeveloperName({ developer }: { developer: DeveloperData }) {
  return (
    <a
      href={developer.profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-lg font-semibold truncate w-full"
      title={developer.username}
    >
      {developer.username}
    </a>
  );
}

function DeveloperAvatar({ developer }: { developer: DeveloperData }) {
  return (
    <Avatar className="w-16 h-16">
      <AvatarImage src={developer.avatar_url} alt={developer.username} />
      <AvatarFallback>{developer.username[0].toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}

function DeveloperRepository({ developer }: { developer: DeveloperData }) {
  return (
    <a
      href={`https://github.com/${developer.repositoryPath}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-pink-300 hover:text-pink-100 w-full px-2"
      title={developer.repositoryPath}
    >
      {developer.repositoryPath.split("/")[1] || developer.repositoryPath}
    </a>
  );
}

function DeveloperLocation({ developer }: { developer: DeveloperData }) {
  if (!developer.location) return null;

  return (
    <p
      className="text-sm text-gray-400 truncate w-full px-2"
      title={developer.location}
    >
      {developer.location}
    </p>
  );
}

function generatePageNumbers(
  currentPage: number,
  totalPages: number,
): (number | "ellipsis")[] {
  const delta = 2;
  const range: (number | "ellipsis")[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      range.push(i);
    }
  } else {
    range.push(1);

    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    if (start > 2) {
      range.push("ellipsis");
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    if (end < totalPages - 1) {
      range.push("ellipsis");
    }

    if (totalPages > 1) {
      range.push(totalPages);
    }
  }

  return range;
}

interface DeveloperPaginationProps {
  currentPage: number;
  pagination: PaginationMetadata | null;
  onPageChange: (page: number) => void;
}

function DeveloperPagination({
  currentPage,
  pagination,
  onPageChange,
}: DeveloperPaginationProps) {
  useEffect(() => {
    if (pagination) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
  }, [currentPage, pagination]);

  if (!pagination || pagination.totalPages <= 1) {
    return null;
  }

  const pages = generatePageNumbers(currentPage, pagination.totalPages);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < pagination.totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex justify-center mt-8 pb-15">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={handlePrevious}
              className={
                currentPage <= 1
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>

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

          <PaginationItem>
            <PaginationNext
              onClick={handleNext}
              className={
                currentPage >= pagination.totalPages
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
