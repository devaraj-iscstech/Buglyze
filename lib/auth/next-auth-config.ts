/**
 * NextAuth.js Configuration with SSO Support (Q3)
 * Supports Email/Password, Google, GitHub, Azure AD, Okta
 */

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import AzureADProvider from 'next-auth/providers/azure-ad'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Email/Password
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)

        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),

    // Google SSO
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // GitHub SSO
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),

    // Azure AD / Microsoft SSO
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/new-user',
  },
}

/**
 * RBAC (Role-Based Access Control) System (Q3)
 */

export type Permission =
  | 'test:create'
  | 'test:view'
  | 'test:delete'
  | 'project:create'
  | 'project:view'
  | 'project:update'
  | 'project:delete'
  | 'org:manage'
  | 'billing:manage'
  | 'user:invite'
  | 'user:remove'

export type Role = 'viewer' | 'member' | 'admin' | 'owner' | 'super_admin'

const rolePermissions: Record<Role, Permission[]> = {
  viewer: ['test:view', 'project:view'],
  member: ['test:create', 'test:view', 'project:view'],
  admin: [
    'test:create',
    'test:view',
    'test:delete',
    'project:create',
    'project:view',
    'project:update',
    'project:delete',
    'user:invite',
  ],
  owner: [
    'test:create',
    'test:view',
    'test:delete',
    'project:create',
    'project:view',
    'project:update',
    'project:delete',
    'org:manage',
    'billing:manage',
    'user:invite',
    'user:remove',
  ],
  super_admin: [
    'test:create',
    'test:view',
    'test:delete',
    'project:create',
    'project:view',
    'project:update',
    'project:delete',
    'org:manage',
    'billing:manage',
    'user:invite',
    'user:remove',
  ],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) || false
}

export function checkPermission(userRole: string, requiredPermission: Permission): boolean {
  return hasPermission(userRole as Role, requiredPermission)
}

/**
 * API Rate Limiting Middleware (Q3)
 */

import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

export const rateLimiters = {
  // Free tier: 10 requests per minute
  free: rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rl:free:',
    }),
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Pro tier: 100 requests per minute
  pro: rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rl:pro:',
    }),
    windowMs: 60 * 1000,
    max: 100,
    message: 'Rate limit exceeded. Upgrade to Team tier for higher limits.',
  }),

  // Team tier: 500 requests per minute
  team: rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rl:team:',
    }),
    windowMs: 60 * 1000,
    max: 500,
  }),

  // Business tier: 2000 requests per minute
  business: rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rl:business:',
    }),
    windowMs: 60 * 1000,
    max: 2000,
  }),

  // Enterprise: No limit
  enterprise: (req: any, res: any, next: any) => next(),
}

export function getRateLimiter(tier: string) {
  switch (tier) {
    case 'free':
      return rateLimiters.free
    case 'pro':
      return rateLimiters.pro
    case 'team':
      return rateLimiters.team
    case 'business':
      return rateLimiters.business
    case 'enterprise':
      return rateLimiters.enterprise
    default:
      return rateLimiters.free
  }
}
