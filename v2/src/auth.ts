import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { upsertUser } from "./lib/users";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      authorization: { params: { scope: "repo" } },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (profile) {
        token.githubId = String(profile.id);
        token.githubUsername = profile.login as string;

        // Upsert user in database on sign-in
        try {
          await upsertUser({
            githubId: String(profile.id),
            githubUsername: profile.login as string,
            email: (profile.email as string) || undefined,
            displayName: (profile.name as string) || undefined,
            avatarUrl: (profile.avatar_url as string) || undefined,
          });
        } catch {
          // Don't block sign-in if DB is unavailable
          console.error("Failed to upsert user on sign-in");
        }
      }
      return token;
    },
    session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.githubId = token.githubId as string;
      session.githubUsername = token.githubUsername as string;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If the URL already points to /dashboard, allow it (preserves ?skill= params)
      if (url.startsWith(`${baseUrl}/dashboard`)) return url;
      // For all other internal URLs (callbackUrl from sign-in pages, etc.), go to dashboard
      if (url.startsWith(baseUrl)) return `${baseUrl}/dashboard`;
      // External URLs → dashboard
      return `${baseUrl}/dashboard`;
    },
  },
});
