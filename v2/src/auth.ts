import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertUser } from "./lib/users";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      authorization: { params: { scope: "openid email profile" } },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (profile) {
        token.googleId = profile.sub as string;

        // Upsert user in database on sign-in
        try {
          await upsertUser({
            googleId: profile.sub as string,
            email: (profile.email as string) || undefined,
            displayName: (profile.name as string) || undefined,
            avatarUrl: (profile.picture as string) || undefined,
          });
        } catch {
          // Don't block sign-in if DB is unavailable
          console.error("Failed to upsert user on sign-in");
        }

        // Register profile in analytics store — fire-and-forget
        fetch("https://ju8k2ygpdc.execute-api.us-west-2.amazonaws.com/prod/esm_live_add_google_auth_post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: profile.sub,
            user_name: profile.name || null,
            user_email: profile.email || null,
            user_image_url: profile.picture || null,
          }),
        }).catch(() => {});
      }
      return token;
    },
    session({ session, token }) {
      session.googleId = token.googleId as string;
      // Ensure user.id is set so dashboard auth checks work
      if (token.sub) session.user.id = token.sub;
      if (token.googleId) session.user.id = token.googleId as string;
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
