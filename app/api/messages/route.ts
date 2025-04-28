import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

interface Message {
  id: string;
  text: string;
  senderId: string;
  recipientId: string;
  created: Date;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email || !session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const otherUserEmail = searchParams.get('user');
    
    if (!otherUserEmail) {
      return new NextResponse('Missing user parameter', { status: 400 });
    }

    // Get the other user's ID
    const otherUser = await prisma.user.findUnique({
      where: { email: otherUserEmail },
      select: { id: true },
    });

    if (!otherUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Fetch messages where current user is either sender or recipient
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            senderId: session.user.id,
            recipientId: otherUserEmail,
          },
          {
            senderId: otherUser.id,
            recipientId: session.user.email,
          },
        ],
      },
      orderBy: {
        created: 'asc',
      },
    });

    // Transform messages to match the frontend interface
    const transformedMessages = messages.map(message => ({
      id: message.id,
      text: message.text,
      sender: message.senderId === session.user.id ? session.user.email : otherUserEmail,
      receiver: message.recipientId === session.user.email ? session.user.email : otherUserEmail,
      createdAt: message.created,
    }));

    return NextResponse.json(transformedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 