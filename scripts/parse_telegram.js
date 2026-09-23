import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SOURCE = resolve("data/telegram_posts.json");
const OUTPUT = resolve("data/posts.json");

function flattenText(text) {
  if (typeof text === "string") return text;
  if (Array.isArray(text)) {
    return text
      .map((segment) => (typeof segment === "string" ? segment : segment.text))
      .join("");
  }
  return "";
}

function truncate(text, max = 120) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

const raw = JSON.parse(readFileSync(SOURCE, "utf8"));

const posts = raw.messages
  .map((message) => ({
    id: message.id,
    date: message.date,
    text: flattenText(message.text).trim(),
  }))
  .filter((post) => post.text.length > 0)
  .map((post) => ({ ...post, text: truncate(post.text) }));

writeFileSync(OUTPUT, JSON.stringify(posts, null, 2));

console.log(`${posts.length} posts written to ${OUTPUT}`);
