import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    companyId?: string
    companyName?: string
    accessToken?: string
  }
  interface Session {
    user: {
      companyId?: string
      companyName?: string
      accessToken?: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    companyId?: string
    companyName?: string
    accessToken?: string
  }
}
