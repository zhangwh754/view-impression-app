import SearchAndReview from "@/components/search-and-review";
import Link from "next/link";

export const metadata = { title: "添加观后感" };

export default function AddPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">添加观后感</h1>
        <Link href="/" className="text-sm text-zinc-500 underline">
          返回首页
        </Link>
      </div>
      <SearchAndReview />
    </main>
  );
}
