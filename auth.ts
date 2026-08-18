import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  callbacks: {
    // 只有主人的谷歌账号允许登录；其他人保持匿名访客（只读）
    signIn({ profile }) {
      const ownerEmail = process.env.OWNER_EMAIL;
      return Boolean(ownerEmail) && profile?.email === ownerEmail;
    },
  },
});

/** 当前请求是否来自主人（已登录且邮箱匹配）。fail-closed：任何一环缺失都返回 false。 */
export async function isOwner(): Promise<boolean> {
  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail) return false;
  const session = await auth();
  const email = session?.user?.email;
  return Boolean(email) && email === ownerEmail;
}
