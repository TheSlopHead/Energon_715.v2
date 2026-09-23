import test from "node:test";
import assert from "node:assert/strict";
import { fetchRepositories, fetchRepositoryCommits, filterRepositories } from "../src/lib/github.ts";

const repository = (id, overrides = {}) => ({
  id, name: `project-${id}`, description: null, language: null,
  html_url: `https://github.com/TheSlopHead/project-${id}`,
  stargazers_count: 0, updated_at: "2026-01-01T00:00:00Z",
  fork: false, archived: false, topics: [], ...overrides,
});

test("loads every page, keeps forks and archives, and deduplicates repositories", async () => {
  const next = "https://api.github.com/users/TheSlopHead/repos?page=2";
  const requests = [];
  const result = await fetchRepositories(async (url) => {
    requests.push(url);
    if (requests.length === 1) return new Response(JSON.stringify([
      repository(1), repository(2, { fork: true }),
    ]), { headers: { Link: `<${next}>; rel="next", <${next}>; rel="last"` } });
    assert.equal(url, next);
    return new Response(JSON.stringify([repository(2, { fork: true }), repository(3, { archived: true })]));
  });
  assert.equal(requests.length, 2);
  assert.match(requests[0], /TheSlopHead\/repos\?/);
  assert.deepEqual(result.map(({ id }) => id), [1, 2, 3]);
  assert.equal(result[1].fork, true);
  assert.equal(result[2].archived, true);
});

test("a failure on a later page rejects rather than presenting an incomplete archive", async () => {
  let requests = 0;
  await assert.rejects(fetchRepositories(async () => {
    if (requests++ === 0) return new Response(JSON.stringify([repository(1)]), {
      headers: { Link: '<https://api.github.com/users/TheSlopHead/repos?page=2>; rel="next"' },
    });
    return new Response("unavailable", { status: 503 });
  }), /Couldn't load/);
});

test("handles rate limits, empty accounts, and malformed responses", async () => {
  for (const status of [403, 429]) {
    await assert.rejects(fetchRepositories(async () => new Response("", { status })), /limiting requests/);
  }
  assert.deepEqual(await fetchRepositories(async () => new Response("[]")), []);
  await assert.rejects(fetchRepositories(async () => new Response("{}")), /unexpected response/);
});

test("combines case-insensitive text and language filters without losing nullable fields", () => {
  const repos = [
    repository(1, { name: "neurodronizm", description: "Telegram ghostwriter", language: "Go" }),
    repository(2, { name: "Energon715", language: "TypeScript", topics: ["portfolio"] }),
    repository(3, { name: "qr21", fork: true }),
  ];
  assert.deepEqual(filterRepositories(repos, "  TELEGRAM ", "Go", "updated").map(({ id }) => id), [1]);
  assert.deepEqual(filterRepositories(repos, "portfolio", "all", "updated").map(({ id }) => id), [2]);
  assert.deepEqual(filterRepositories(repos, "", "Unspecified", "updated").map(({ id }) => id), [3]);
  assert.deepEqual(filterRepositories(repos, "telegram", "TypeScript", "updated"), []);
});

test("sorts by date, stars, and name without mutating cached data", () => {
  const repos = [
    repository(1, { name: "zebra", updated_at: "2026-03-01T00:00:00Z" }),
    repository(2, { name: "alpha", stargazers_count: 8 }),
    repository(3, { name: "beta", updated_at: "2026-02-01T00:00:00Z", stargazers_count: 3 }),
  ];
  assert.deepEqual(filterRepositories(repos, "", "all", "updated").map(({ id }) => id), [1, 3, 2]);
  assert.deepEqual(filterRepositories(repos, "", "all", "stars").map(({ id }) => id), [2, 3, 1]);
  assert.deepEqual(filterRepositories(repos, "", "all", "name").map(({ id }) => id), [2, 3, 1]);
  assert.deepEqual(repos.map(({ id }) => id), [1, 2, 3]);
});

test("loads five real commit records and keeps only the first message line", async () => {
  let requestedUrl;
  const result = await fetchRepositoryCommits("project name", async (url) => {
    requestedUrl = url;
    return new Response(JSON.stringify([
      {
        sha: "abc123",
        html_url: "https://github.com/TheSlopHead/project-name/commit/abc123",
        commit: {
          message: "Add memory browser\n\nLong explanation",
          author: { date: "2026-09-20T12:00:00Z" },
        },
      },
    ]));
  });

  assert.match(requestedUrl, /project%20name\/commits\?per_page=5$/);
  assert.deepEqual(result, [
    {
      sha: "abc123",
      message: "Add memory browser",
      date: "2026-09-20T12:00:00Z",
      html_url: "https://github.com/TheSlopHead/project-name/commit/abc123",
    },
  ]);
});

test("handles empty repositories and commit API failures", async () => {
  assert.deepEqual(
    await fetchRepositoryCommits("empty", async () => new Response("", { status: 409 })),
    [],
  );
  await assert.rejects(
    fetchRepositoryCommits("limited", async () => new Response("", { status: 403 })),
    /limiting requests/,
  );
});
