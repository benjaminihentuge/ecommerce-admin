import NextAuth, { getServerSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';

const adminEmails = ['benjaminihentuge2017@gmail.com'];

// Validate environment variables
if (!process.env.GOOGLE_ID || !process.env.GOOGLE_SECRET || !process.env.SECRET) {
  console.error('Missing required environment variables. Check GOOGLE_ID, GOOGLE_SECRET, and SECRET.');
  throw new Error('Missing required environment variables.');
}

export const authOptions = {
  secret: process.env.SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
  adapter: MongoDBAdapter(clientPromise),
  callbacks: {
    async session({ session }) {
      if (adminEmails.includes(session?.user?.email)) {
        return session; // Allow session for admin users
      }
      return null; // Return null for non-admin users
    },
  },
};

export default NextAuth(authOptions);

export async function isAdminRequest(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      res.status(401).end('Unauthorized: No session found');
      throw new Error('Unauthorized: No session found');
    }

    if (!adminEmails.includes(session.user?.email)) {
      res.status(401).end('Unauthorized: Not an admin');
      throw new Error('Unauthorized: Not an admin');
    }
  } catch (error) {
    console.error('Error in isAdminRequest:', error.message);
    res.status(500).end('Internal Server Error');
    throw error;
  }
}
