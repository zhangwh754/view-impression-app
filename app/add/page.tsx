import { loginWithGoogle } from "@/app/auth-actions";
import { isOwner } from "@/auth";
import SearchAndReview from "@/components/search-and-review";
import Link from "next/link";

export const metadata = { title: "添加观后感" };

export const dynamic = "force-dynamic";

export default async function AddPage() {
  if (!(await isOwner())) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold">添加观后感</h1>
        <div className="mt-10 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 py-20 text-center text-zinc-500">
          <p>只有站长登录后才能添加观后感。</p>
          <form action={loginWithGoogle} className="mt-4">
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-5 py-2 text-sm font-medium text-white dark:text-zinc-900"
            >
              使用谷歌账号登录
            </button>
          </form>
          <p className="mt-4">
            <Link href="/" className="text-sm text-zinc-500 underline">
              返回首页
            </Link>
          </p>
        </div>
      </main>
    );
  }

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
