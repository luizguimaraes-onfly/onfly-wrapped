import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { decode } from 'next-auth/jwt'

const isDev   = process.env.NODE_ENV === 'development'
const domain  = process.env.ALLOWED_EMAIL_DOMAIN ?? 'onfly.com.br'

const handler = NextAuth({
  providers: [
    // Onfly SSO — recebe o onflyToken criado por /api/auth/onfly/callback
    CredentialsProvider({
      id:   'onfly-sso',
      name: 'Onfly SSO',
      credentials: { onflyToken: { type: 'text' } },
      async authorize(credentials) {
        if (!credentials?.onflyToken) return null
        try {
          const payload = await decode({
            token:  credentials.onflyToken,
            secret: process.env.NEXTAUTH_SECRET!,
          })
          if (!payload?.email) return null
          return {
            id:          String(payload.userId ?? payload.sub ?? payload.email),
            email:       payload.email as string,
            name:        payload.name  as string,
            companyId:   String(payload.companyId   ?? ''),
            companyName: String(payload.companyName ?? ''),
            accessToken: String(payload.accessToken ?? ''),
          }
        } catch {
          return null
        }
      },
    }),

    // Dev mode — login sem OAuth
    ...(isDev ? [
      CredentialsProvider({
        id:   'dev',
        name: 'Dev Login',
        credentials: {
          email:     { label: 'Email',      type: 'email' },
          companyId: { label: 'Company ID', type: 'text'  },
        },
        async authorize(credentials) {
          const email = credentials?.email ?? ''
          if (!email.endsWith(`@${domain}`)) return null
          return {
            id:          email,
            email,
            name:        email.split('@')[0],
            companyId:   credentials?.companyId ?? '',
            companyName: '',
          }
        },
      }),
    ] : []),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'onfly-sso') return !!user?.email
      return (user.email ?? '').endsWith(`@${domain}`)
    },
    async jwt({ token, user }) {
      if (user) {
        token.userId      = user.id
        token.companyId   = (user as { companyId?: string }).companyId     ?? ''
        token.companyName = (user as { companyName?: string }).companyName ?? ''
        token.accessToken = (user as { accessToken?: string }).accessToken ?? ''
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.userId      = token.userId      as string | undefined
        session.user.companyId   = token.companyId   as string | undefined
        session.user.companyName = token.companyName as string | undefined
        session.user.accessToken = token.accessToken as string | undefined
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error:  '/login',
  },
})

export { handler as GET, handler as POST }
