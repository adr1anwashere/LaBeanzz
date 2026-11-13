import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { AppSession } from "@/lib/session";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }) {
      // On first sign-in exchange the Google ID token for our app JWT
      if (account?.id_token) {
        try {
          const res = await fetch(
            `${process.env.BACKEND_URL}/api/auth/google`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential: account.id_token }),
            }
          );
          if (res.ok) {
            const data = await res.json();
            token["appToken"] = data.token;
            token["role"] = data.user.role;
            token["userId"] = data.user.id;
          }
        } catch {
          // Backend unreachable during token exchange — handled at session level
        }
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }): Promise<any> {
      const s = session as AppSession;
      s.appToken = token["appToken"] as string | undefined;
      s.user = {
        ...s.user,
        role: token["role"] as string | null | undefined,
        id: token["userId"] as string | undefined,
      };
      return s;
    },
  },
  pages: {
    signIn: "/login",
  },
});
