import React, { createContext, useContext } from "react";
import { useRepoData } from "../hooks/repo-data";
import type { RepoData, PaginationMetadata } from "../interface/repository"; // Import the type

// Define the type for the context value
type RepoDataContextType = {
  data: RepoData[] | [];
  loading: boolean;
  error: string | "";
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pagination: PaginationMetadata | null;
};

const RepoDataContext = createContext<RepoDataContextType | null>(null);

export const RepoDataProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    undefined,
  );
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const { data, pagination, loading, error } = useRepoData(
    "/trending",
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
        selectedDate,
        setSelectedDate,
        currentPage,
        setCurrentPage,
        pagination,
      }}
    >
      {children}
    </RepoDataContext.Provider>
  );
};

export const useRepoDataContext = () => {
  const context = useContext(RepoDataContext);
  if (!context) {
    throw new Error(
      "useRepoDataContext must be used within a RepoDataProvider",
    );
  }
  return context;
};
