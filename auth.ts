import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  callbacks: {
    // 只有主人的谷歌账号允许登录；其他人保持匿名访客（只读）
    signIn({ profile }) {
      return profile?.email === process.env.OWNER_EMAIL;
    },
  },
});

/** 当前请求是否来自主人（已登录且邮箱匹配）。 */
export async function isOwner(): Promise<boolean> {
  const session = await auth();
  return session?.user?.email === process.env.OWNER_EMAIL;
}
