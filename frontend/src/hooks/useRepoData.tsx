import { useState, useEffect } from "react";
import type {
  ApiResponse,
  RawRepoData,
  RepoData,
} from "@/interface/repository.tsx";

export function useRepoData(endpoint: string) {
  const base_url = import.meta.env.VITE_DATABASE_URL as string;
  const token = import.meta.env.VITE_DEV_AUTH as string;
  if (!base_url || !token)
    throw new Error("Missing VITE_DATABASE_URL or VITE_DEV_AUTH in env");

  const [data, setData] = useState<RepoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const trending_url = `${base_url}${endpoint}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(trending_url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const json = (await res.json()) as ApiResponse;

        // transform RawRepoData[] into UI-friendly RepoData[]
        const mapped: RepoData[] = json.data.map((r: RawRepoData) => {
          return {
            name: r.name,
            description: r.description,
            url: r.url,
            trendingDate: r.trendingDate,
          };
        });
        setData(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [trending_url, token]);

  return { data, loading, error };
}
