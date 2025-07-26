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
//
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

// https://api.github.com/users/XAMPPRocky
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

// example response from GitHub API for a repository
// for repo XAMPPRocky/tokei
/*
{
  "id": 36323226,
  "node_id": "MDEwOlJlcG9zaXRvcnkzNjMyMzIyNg==",
  "name": "tokei",
  "full_name": "XAMPPRocky/tokei",
  "private": false,
  "owner": {
    "login": "XAMPPRocky",
    "id": 4464295,
    "node_id": "MDQ6VXNlcjQ0NjQyOTU=",
    "avatar_url": "https://avatars.githubusercontent.com/u/4464295?v=4",
    "gravatar_id": "",
    "url": "https://api.github.com/users/XAMPPRocky",
    "html_url": "https://github.com/XAMPPRocky",
    "followers_url": "https://api.github.com/users/XAMPPRocky/followers",
    "following_url": "https://api.github.com/users/XAMPPRocky/following{/other_user}",
    "gists_url": "https://api.github.com/users/XAMPPRocky/gists{/gist_id}",
    "starred_url": "https://api.github.com/users/XAMPPRocky/starred{/owner}{/repo}",
    "subscriptions_url": "https://api.github.com/users/XAMPPRocky/subscriptions",
    "organizations_url": "https://api.github.com/users/XAMPPRocky/orgs",
    "repos_url": "https://api.github.com/users/XAMPPRocky/repos",
    "events_url": "https://api.github.com/users/XAMPPRocky/events{/privacy}",
    "received_events_url": "https://api.github.com/users/XAMPPRocky/received_events",
    "type": "User",
    "user_view_type": "public",
    "site_admin": false
  },
  "html_url": "https://github.com/XAMPPRocky/tokei",
  "description": "Count your code, quickly.",
  "fork": false,
  "url": "https://api.github.com/repos/XAMPPRocky/tokei",
  "forks_url": "https://api.github.com/repos/XAMPPRocky/tokei/forks",
  "keys_url": "https://api.github.com/repos/XAMPPRocky/tokei/keys{/key_id}",
  "collaborators_url": "https://api.github.com/repos/XAMPPRocky/tokei/collaborators{/collaborator}",
  "teams_url": "https://api.github.com/repos/XAMPPRocky/tokei/teams",
  "hooks_url": "https://api.github.com/repos/XAMPPRocky/tokei/hooks",
  "issue_events_url": "https://api.github.com/repos/XAMPPRocky/tokei/issues/events{/number}",
  "events_url": "https://api.github.com/repos/XAMPPRocky/tokei/events",
  "assignees_url": "https://api.github.com/repos/XAMPPRocky/tokei/assignees{/user}",
  "branches_url": "https://api.github.com/repos/XAMPPRocky/tokei/branches{/branch}",
  "tags_url": "https://api.github.com/repos/XAMPPRocky/tokei/tags",
  "blobs_url": "https://api.github.com/repos/XAMPPRocky/tokei/git/blobs{/sha}",
  "git_tags_url": "https://api.github.com/repos/XAMPPRocky/tokei/git/tags{/sha}",
  "git_refs_url": "https://api.github.com/repos/XAMPPRocky/tokei/git/refs{/sha}",
  "trees_url": "https://api.github.com/repos/XAMPPRocky/tokei/git/trees{/sha}",
  "statuses_url": "https://api.github.com/repos/XAMPPRocky/tokei/statuses/{sha}",
  "languages_url": "https://api.github.com/repos/XAMPPRocky/tokei/languages",
  "stargazers_url": "https://api.github.com/repos/XAMPPRocky/tokei/stargazers",
  "contributors_url": "https://api.github.com/repos/XAMPPRocky/tokei/contributors",
  "subscribers_url": "https://api.github.com/repos/XAMPPRocky/tokei/subscribers",
  "subscription_url": "https://api.github.com/repos/XAMPPRocky/tokei/subscription",
  "commits_url": "https://api.github.com/repos/XAMPPRocky/tokei/commits{/sha}",
  "git_commits_url": "https://api.github.com/repos/XAMPPRocky/tokei/git/commits{/sha}",
  "comments_url": "https://api.github.com/repos/XAMPPRocky/tokei/comments{/number}",
  "issue_comment_url": "https://api.github.com/repos/XAMPPRocky/tokei/issues/comments{/number}",
  "contents_url": "https://api.github.com/repos/XAMPPRocky/tokei/contents/{+path}",
  "compare_url": "https://api.github.com/repos/XAMPPRocky/tokei/compare/{base}...{head}",
  "merges_url": "https://api.github.com/repos/XAMPPRocky/tokei/merges",
  "archive_url": "https://api.github.com/repos/XAMPPRocky/tokei/{archive_format}{/ref}",
  "downloads_url": "https://api.github.com/repos/XAMPPRocky/tokei/downloads",
  "issues_url": "https://api.github.com/repos/XAMPPRocky/tokei/issues{/number}",
  "pulls_url": "https://api.github.com/repos/XAMPPRocky/tokei/pulls{/number}",
  "milestones_url": "https://api.github.com/repos/XAMPPRocky/tokei/milestones{/number}",
  "notifications_url": "https://api.github.com/repos/XAMPPRocky/tokei/notifications{?since,all,participating}",
  "labels_url": "https://api.github.com/repos/XAMPPRocky/tokei/labels{/name}",
  "releases_url": "https://api.github.com/repos/XAMPPRocky/tokei/releases{/id}",
  "deployments_url": "https://api.github.com/repos/XAMPPRocky/tokei/deployments",
  "created_at": "2015-05-26T20:55:45Z",
  "updated_at": "2025-06-29T07:05:30Z",
  "pushed_at": "2025-02-24T17:26:58Z",
  "git_url": "git://github.com/XAMPPRocky/tokei.git",
  "ssh_url": "git@github.com:XAMPPRocky/tokei.git",
  "clone_url": "https://github.com/XAMPPRocky/tokei.git",
  "svn_url": "https://github.com/XAMPPRocky/tokei",
  "homepage": "",
  "size": 2994,
  "stargazers_count": 12729,
  "watchers_count": 12729,
  "language": "Rust",
  "has_issues": true,
  "has_projects": false,
  "has_downloads": true,
  "has_wiki": false,
  "has_pages": false,
  "has_discussions": true,
  "forks_count": 588,
  "mirror_url": null,
  "archived": false,
  "disabled": false,
  "open_issues_count": 198,
  "license": {
    "key": "other",
    "name": "Other",
    "spdx_id": "NOASSERTION",
    "url": null,
    "node_id": "MDc6TGljZW5zZTA="
  },
  "allow_forking": true,
  "is_template": false,
  "web_commit_signoff_required": false,
  "topics": [
    "badge",
    "cli",
    "cloc",
    "code",
    "command-line-tool",
    "linux",
    "macos",
    "rust",
    "sloc",
    "statistics",
    "tokei",
    "windows"
  ],
  "visibility": "public",
  "forks": 588,
  "open_issues": 198,
  "watchers": 12729,
  "default_branch": "master",
  "temp_clone_token": null,
  "network_count": 588,
  "subscribers_count": 47
}
 */

//example of github rest api user response
/*
{
  "login": "XAMPPRocky",
  "id": 4464295,
  "node_id": "MDQ6VXNlcjQ0NjQyOTU=",
  "avatar_url": "https://avatars.githubusercontent.com/u/4464295?v=4",
  "gravatar_id": "",
  "url": "https://api.github.com/users/XAMPPRocky",
  "html_url": "https://github.com/XAMPPRocky",
  "followers_url": "https://api.github.com/users/XAMPPRocky/followers",
  "following_url": "https://api.github.com/users/XAMPPRocky/following{/other_user}",
  "gists_url": "https://api.github.com/users/XAMPPRocky/gists{/gist_id}",
  "starred_url": "https://api.github.com/users/XAMPPRocky/starred{/owner}{/repo}",
  "subscriptions_url": "https://api.github.com/users/XAMPPRocky/subscriptions",
  "organizations_url": "https://api.github.com/users/XAMPPRocky/orgs",
  "repos_url": "https://api.github.com/users/XAMPPRocky/repos",
  "events_url": "https://api.github.com/users/XAMPPRocky/events{/privacy}",
  "received_events_url": "https://api.github.com/users/XAMPPRocky/received_events",
  "type": "User",
  "user_view_type": "public",
  "site_admin": false,
  "name": null,
  "company": null,
  "blog": "https://xampproc.ky",
  "location": "Berlin",
  "email": null,
  "hireable": true,
  "bio": "Artwork by https://buffienguyen.com",
  "twitter_username": null,
  "public_repos": 137,
  "public_gists": 2,
  "followers": 711,
  "following": 138,
  "created_at": "2013-05-18T11:34:54Z",
  "updated_at": "2025-06-19T11:20:57Z"
}
*/
