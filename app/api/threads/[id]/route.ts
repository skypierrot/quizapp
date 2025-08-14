import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { threads, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const thread = await db.query.threads.findFirst({
      where: eq(threads.id, id),
      with: {
        user: true,
        comments: {
          with: {
            user: true,
          },
        },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    return NextResponse.json(thread);
  } catch (error) {
    console.error('Error fetching thread:', error);
    return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { title, content } = await req.json();

    const thread = await db.query.threads.findFirst({
      where: eq(threads.id, id),
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    if (thread.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedThread = await db
      .update(threads)
      .set({ title, content, updatedAt: new Date() })
      .where(eq(threads.id, id))
      .returning();

    return NextResponse.json(updatedThread[0]);
  } catch (error) {
    console.error('Error updating thread:', error);
    return NextResponse.json({ error: 'Failed to update thread' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const thread = await db.query.threads.findFirst({
      where: eq(threads.id, id),
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    if (thread.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.delete(threads).where(eq(threads.id, id));

    return NextResponse.json({ message: 'Thread deleted successfully' });
  } catch (error) {
    console.error('Error deleting thread:', error);
    return NextResponse.json({ error: 'Failed to delete thread' }, { status: 500 });
  }
} 