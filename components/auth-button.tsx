import { loginWithGoogle, logout } from "@/app/auth-actions";
import { auth, isOwner } from "@/auth";

export default async function AuthButton() {
  if (await isOwner()) {
    const session = await auth();
    return (
      <form action={logout}>
        <button
          type="submit"
          className="text-sm text-zinc-500 underline"
          title={session?.user?.email ?? ""}
        >
          退出登录
        </button>
      </form>
    );
  }

  return (
    <form action={loginWithGoogle}>
      <button type="submit" className="text-sm text-zinc-500 underline">
        谷歌账号登录
      </button>
    </form>
  );
}
