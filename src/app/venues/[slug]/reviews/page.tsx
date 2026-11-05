import { VenueReviewsPage } from "@/components/features/venues/VenueReviewsPage";

export const metadata = { title: "Đánh giá sân | SmashBook" };

export default function ReviewsPage({ params, searchParams }: {
  params: { slug: string };
  searchParams?: { booking?: string | string[] };
}) {
  return <VenueReviewsPage slug={params.slug} bookingCode={typeof searchParams?.booking === "string" ? searchParams.booking : ""} />;
}
