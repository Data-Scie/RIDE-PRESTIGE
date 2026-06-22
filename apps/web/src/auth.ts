import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile?.email) {
        try {
          const res = await fetch(`${API_URL}/api/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-secret': process.env.INTERNAL_API_SECRET || '',
            },
            body: JSON.stringify({ email: profile.email, fullName: profile.name || profile.email }),
          });
          const body = await res.json();
          if (res.ok && body.token) {
            token.backendToken = body.token;
          }
        } catch {
          // Backend unreachable - user still gets a Google session, just no backend-linked booking yet.
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.backendToken) {
        (session as typeof session & { backendToken?: string }).backendToken = token.backendToken as string;
      }
      return session;
    },
  },
});
