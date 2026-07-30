export type MediaKind = "image" | "video";

export type RedditMedia = {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  permalink: string;
  url: string;
  posterUrl?: string;
  mediaKind: MediaKind;
  width: number;
  height: number;
  isGallery: boolean;
  score: number;
  created: number;
};

/** @deprecated alias */
export type RedditImage = RedditMedia;
