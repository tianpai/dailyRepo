import { buildUrlString, type Query } from "@/lib/url-builder";
import type { ApiResponse } from "@/interface/endpoint";

export async function get<T>(
  baseUrl: string,
  endpoint: string | string[],
  query?: Query,
): Promise<T> {
  const url = buildUrlString(baseUrl, endpoint, query);
  const res = await fetch(url);
  const json: ApiResponse<T> = await res.json();
  if (json.isSuccess) return json.data;
  throw new Error(json.error.message);
}

export async function postJson<T>(
  baseUrl: string,
  endpoint: string | string[],
  body: unknown,
  query?: Query,
): Promise<T> {
  const url = buildUrlString(baseUrl, endpoint, query);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const json: ApiResponse<T> = await res.json();
  if (json.isSuccess) return json.data;
  throw new Error(json.error.message);
}

