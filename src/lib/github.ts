export const GITHUB_USERNAME = "TheSlopHead";
export const GITHUB_PROFILE = `https://github.com/${GITHUB_USERNAME}`;

export interface Repository {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
  fork: boolean;
  archived: boolean;
  topics: string[];
}

export interface RepositoryCommit {
  sha: string;
  message: string;
  date: string;
  html_url: string;
}

export async function fetchRepositories(request: typeof fetch = fetch): Promise<Repository[]> {
  let url: string | undefined = `https://api.github.com/users/${GITHUB_USERNAME}/repos?type=owner&per_page=100&sort=updated&direction=desc`;
  const repositories = new Map<number, Repository>();

  while (url) {
    const response = await request(url, {
      headers: { Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        throw new Error("GitHub is limiting requests right now. Try again later or browse on GitHub.");
      }
      throw new Error("Couldn't load the repositories. Please try again.");
    }

    const page: Repository[] = await response.json();
    if (!Array.isArray(page)) throw new Error("GitHub returned an unexpected response. Please try again.");
    for (const repository of page) repositories.set(repository.id, repository);
    url = response.headers.get("Link")?.match(/<([^>]+)>;\s*rel="next"/)?.[1];
  }

  return [...repositories.values()];
}

export async function fetchRepositoryCommits(
  repositoryName: string,
  request: typeof fetch = fetch,
): Promise<RepositoryCommit[]> {
  const repository = encodeURIComponent(repositoryName);
  const response = await request(
    `https://api.github.com/repos/${GITHUB_USERNAME}/${repository}/commits?per_page=5`,
    {
      headers: { Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(15_000),
    },
  );

  if (response.status === 409) return [];
  if (!response.ok) {
    if (response.status === 403 || response.status === 429) {
      throw new Error("GitHub is limiting requests right now. Try again later.");
    }
    throw new Error("Couldn't load this project's commit history.");
  }

  const commits: Array<{
    sha: string;
    html_url: string;
    commit: { message: string; author: { date: string } };
  }> = await response.json();
  if (!Array.isArray(commits)) {
    throw new Error("GitHub returned an unexpected commit response.");
  }

  return commits.slice(0, 5).map((entry) => ({
    sha: entry.sha,
    message: entry.commit.message.split("\n", 1)[0],
    date: entry.commit.author.date,
    html_url: entry.html_url,
  }));
}

export type RepositorySort = "updated" | "stars" | "name";

export function filterRepositories(
  repositories: Repository[], query: string, language: string, sort: RepositorySort,
): Repository[] {
  const search = query.trim().toLocaleLowerCase();
  return repositories.filter((repository) => {
    const matchesLanguage = language === "all" || (repository.language ?? "Unspecified") === language;
    const searchable = [repository.name, repository.description, ...(repository.topics ?? [])].join(" ").toLocaleLowerCase();
    return matchesLanguage && searchable.includes(search);
  }).sort((a, b) => {
    if (sort === "stars") return b.stargazers_count - a.stargazers_count || a.name.localeCompare(b.name);
    if (sort === "name") return a.name.localeCompare(b.name);
    return Date.parse(b.updated_at) - Date.parse(a.updated_at) || a.name.localeCompare(b.name);
  });
}
