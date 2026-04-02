import type { NextApiRequest, NextApiResponse } from "next";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/hash";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        name: { label: "Name", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const name = credentials?.name?.trim();
        const password = credentials?.password;

        if (!name || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { name },
        });

        if (!user) {
          return null;
        }

        const passwordOk = await verifyPassword(password, user.password);
        if (!passwordOk) {
          return null;
        }

        return {
          id: String(user.id),
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = String(user.id);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export function getServerAuthSession(req: NextApiRequest, res: NextApiResponse) {
  return getServerSession(req, res, authOptions);
}

export async function requireApiUserId(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<number | null> {
  const session = await getServerAuthSession(req, res);
  const rawUserId = session?.user?.id;
  const userId = rawUserId ? Number(rawUserId) : Number.NaN;

  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  return userId;
}
