export type RatingValue = 5 | 4 | 3 | 2 | 1;

export interface SessionRating {
  createdAt: number;
  updatedAt: number;
  comment: string | null;
  rate: RatingValue;
}

export const RATING_EMOJIS: Record<RatingValue, string> = {
  5: "🤩",
  4: "🙂",
  3: "😐",
  2: "🫤",
  1: "😡",
};

export const RATING_LABELS: Record<RatingValue, string> = {
  5: "Perfect",
  4: "Good",
  3: "Acceptable",
  2: "Not good",
  1: "Horrible",
}; 