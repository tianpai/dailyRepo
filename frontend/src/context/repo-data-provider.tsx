import React, { createContext, useContext } from "react";
import { useRepoData } from "../hooks/repo-data";
import type { RepoData } from "../interface/repository"; // Import the type

// Define the type for the context value
type RepoDataContextType = {
  data: RepoData[] | [];
  loading: boolean;
  error: string | "";
};

const RepoDataContext = createContext<RepoDataContextType | null>(null);

export const RepoDataProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { data, loading, error } = useRepoData("/trending");

  return (
    <RepoDataContext.Provider value={{ data, loading, error }}>
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
