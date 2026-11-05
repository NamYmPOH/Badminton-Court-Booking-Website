import { getDemoReviews } from "../data/demo-reviews";

export function summarizeVenueReviews(venueId: string, realSum: number, realCount: number) {
  const demo = getDemoReviews(venueId);
  const count = realCount + demo.length;
  return {
    average: count ? (realSum + demo.reduce((sum, r) => sum + r.rating, 0)) / count : 0,
    count, demoCount: demo.length, realCount,
  };
}
