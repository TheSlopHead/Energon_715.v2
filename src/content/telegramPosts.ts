import posts from "../../data/posts.json";

export interface TelegramPost {
  id: number;
  date: string;
  text: string;
}

export const telegramPosts: TelegramPost[] = posts;
