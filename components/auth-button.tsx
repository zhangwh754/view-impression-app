import { loginWithGoogle, logout } from "@/app/auth-actions";
import { auth } from "@/auth";

export default async function AuthButton() {
  const session = await auth();
  const isOwner = session?.user?.email === process.env.OWNER_EMAIL;

  if (isOwner) {
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
