import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const isProduction = process.env.NODE_ENV === "production";
const nextAuthUrl = process.env.NEXTAUTH_URL || "";
// Evita erro de cookie __Secure- em ambientes de teste local ou hosts sem SSL
const useSecureCookies = isProduction && nextAuthUrl.startsWith("https://") && !nextAuthUrl.includes("localhost");

const AUTH_SECRET = process.env.NEXTAUTH_SECRET || "maitre-ats-production-secret-key-123";

export const authOptions: NextAuthOptions = {
  secret: AUTH_SECRET,
  useSecureCookies,
  cookies: {
    sessionToken: {
      name: useSecureCookies ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios.");
        }

        const cleanEmail = credentials.email.trim().toLowerCase();

        const user = await prisma.user.findFirst({
          where: {
            email: {
              equals: cleanEmail,
              mode: "insensitive",
            },
          },
          include: { organization: true },
        });

        if (!user || !user.password) {
          throw new Error("E-mail ou senha incorretos.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("E-mail ou senha incorretos.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization?.name || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role || "CANDIDATE";
        token.organizationId = user.organizationId || null;
        token.organizationName = user.organizationName || null;
      } else if (token?.email) {
        // Sincroniza em tempo real caso o usuário tenha sido promovido para ADMIN ou RECRUITER
        try {
          const dbUser = await prisma.user.findFirst({
            where: { email: { equals: token.email as string, mode: "insensitive" } },
            include: { organization: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.organizationId = dbUser.organizationId;
            token.organizationName = dbUser.organization?.name || null;
            if (dbUser.name) token.name = dbUser.name;
          }
        } catch {
          // Fallback resiliente
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = (token.email as string) || session.user.email;
        session.user.name = (token.name as string) || session.user.name;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string | null;
        session.user.organizationName = token.organizationName as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias de persistência de sessão
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
};
