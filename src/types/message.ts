/** A chat message as the client renders it (author resolved to a side). */
export type ChatMessage = {
  id: string;
  author: "user" | "match";
  body: string;
  createdAt: number;
};
