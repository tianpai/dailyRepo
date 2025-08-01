/* ============================================================================
 *
 *                   DailyRepo Backend RestfulAPI response types
 *
 * =============================================================================
 */

interface ApiBase {
  isCached: boolean;
  date: string;
  isSuccess: boolean;
}

// Pagination is encapsulated in data in ApiResponse
export interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiSuccess<T> extends ApiBase {
  isSuccess: true;
  data: T;
  error?: never;
}

export interface ApiError extends ApiBase {
  isSuccess: false;
  error: { code: number; message: string };
  data?: never;
}
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function makeSuccess<T>(data: T, date: string): ApiSuccess<T> {
  return {
    isCached: false,
    date: date,
    isSuccess: true,
    data,
  };
}

export function makeError(
  date: string,
  code: number,
  message: string,
): ApiError {
  return {
    isCached: false,
    date: date,
    isSuccess: false,
    error: { code, message },
  };
}

import { Response } from "express";
export function errorResponse(
  res: Response,
  statusCode: number,
  msg: string,
): void {
  const today = new Date().toISOString().split("T")[0];
  res.status(statusCode).json(makeError(today, statusCode, msg));
}

/* ============================================================================
 *
 *                       GitHub rest API response types
 *
 * =============================================================================
 */

// from https://api.github.com/repos/{owner}/{repo}
// note wiht trailing slash https://api.github.com/repos/{owner}/{repo}/
// will get 404 Not Found
export interface GitHubRepo {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: Owner;
  html_url: string;
  description: string;
  fork: boolean;
  url: string;
  forks_url: string;
  keys_url: string;
  collaborators_url: string;
  teams_url: string;
  hooks_url: string;
  issue_events_url: string;
  events_url: string;
  assignees_url: string;
  branches_url: string;
  tags_url: string;
  blobs_url: string;
  git_tags_url: string;
  git_refs_url: string;
  trees_url: string;
  statuses_url: string;
  languages_url: string;
  stargazers_url: string;
  contributors_url: string;
  subscribers_url: string;
  subscription_url: string;
  commits_url: string;
  git_commits_url: string;
  comments_url: string;
  issue_comment_url: string;
  contents_url: string;
  compare_url: string;
  merges_url: string;
  archive_url: string;
  downloads_url: string;
  issues_url: string;
  pulls_url: string;
  milestones_url: string;
  notifications_url: string;
  labels_url: string;
  releases_url: string;
  deployments_url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  git_url: string;
  ssh_url: string;
  clone_url: string;
  svn_url: string;
  homepage: string;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  has_discussions: boolean;
  forks_count: number;
  mirror_url: any;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  license: License;
  allow_forking: boolean;
  is_template: boolean;
  web_commit_signoff_required: boolean;
  topics: string[];
  visibility: string;
  forks: number;
  open_issues: number;
  watchers: number;
  default_branch: string;
  temp_clone_token: any;
  network_count: number;
  subscribers_count: number;
}

export interface Owner {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  user_view_type: string;
  site_admin: boolean;
}

export interface License {
  key: string;
  name: string;
  spdx_id: string;
  url: any;
  node_id: string;
}

// trailing slash will get 404 Not Found
export interface GithubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  user_view_type: string;
  site_admin: boolean;
  name: any;
  company: any;
  blog: string;
  location: string;
  email: any;
  hireable: boolean;
  bio: string;
  twitter_username: any;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}
