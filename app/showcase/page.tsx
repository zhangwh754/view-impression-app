import { isOwner } from "@/auth";
import AuthButton from "@/components/auth-button";
import ShowcaseEditor from "@/components/showcase-editor";
import SiteTabs from "@/components/site-tabs";
import type { ShowcaseWorkOption } from "@/modules/showcase/domain";
import {
  listReviewedWorks,
  listReviews,
} from "@/modules/reviews/service";
import { getShowcase } from "@/modules/showcase/service";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "喜欢的作品一览",
  description: "我的喜欢作品分类一览",
};

export default async function ShowcasePage() {
  const [showcase, owner] = await Promise.all([getShowcase(), isOwner()]);
  let availableWorks: ShowcaseWorkOption[] = [];
  let existingCatalogWorks: Awaited<ReturnType<typeof listReviewedWorks>> = [];

  if (owner) {
    const [reviews, reviewedWorks] = await Promise.all([
      listReviews("rating"),
      listReviewedWorks(),
    ]);
    existingCatalogWorks = reviewedWorks;
    availableWorks = reviews
      .map((review) => ({
        id: review.work.id,
        title: review.work.title,
        originalTitle: review.work.originalTitle,
        coverUrl: review.work.coverUrl,
        type: review.work.type,
        year: review.work.year,
        myRating: review.myRating,
        updatedAt: review.updatedAt,
        genres: review.work.genres,
      }))
      .sort(
        (left, right) =>
          (right.myRating ?? -1) - (left.myRating ?? -1) ||
          right.updatedAt.localeCompare(left.updatedAt),
      );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <SiteTabs active="showcase" />
      <div className="mb-6 flex justify-end">
        <AuthButton />
      </div>
      <ShowcaseEditor
        initialShowcase={showcase}
        availableWorks={availableWorks}
        existingCatalogWorks={existingCatalogWorks}
        owner={owner}
      />
    </main>
  );
}
