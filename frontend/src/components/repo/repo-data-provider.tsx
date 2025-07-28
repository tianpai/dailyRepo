import React, { createContext, useContext } from "react";
import { useTrendingRepos, type RepoProps } from "@/hooks/useTrendingRepos";
import { useDateContext } from "@/components/date-provider";
import type { Pagination } from "@/interface/endpoint";

// Define the type for the context value
type RepoDataContextType = {
  data: RepoProps[] | [];
  loading: boolean;
  error: string | "";
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pagination: Pagination | null;
};

const RepoDataContext = createContext<RepoDataContextType | null>(null);

export function RepoDataProvider({ children }: { children: React.ReactNode }) {
  const { selectedDate } = useDateContext();
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const { data, pagination, loading, error } = useTrendingRepos(
    selectedDate,
    currentPage,
  );

  // Reset to page 1 when date changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate]);

  return (
    <RepoDataContext.Provider
      value={{
        data,
        loading,
        error,
        currentPage,
        setCurrentPage,
        pagination,
      }}
    >
      {children}
    </RepoDataContext.Provider>
  );
}

export function useRepoDataContext() {
  const context = useContext(RepoDataContext);
  if (!context) {
    throw new Error(
      "useRepoDataContext must be used within a RepoDataProvider",
    );
  }
  return context;
}
