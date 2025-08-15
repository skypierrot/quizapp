import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notices } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const notice = await db.query.notices.findFirst({
      where: eq(notices.id, id),
    });

    if (!notice) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404 });
    }

    return NextResponse.json(notice);
  } catch (error) {
    console.error('Error fetching notice:', error);
    return NextResponse.json({ error: 'Failed to fetch notice' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { title, content } = await request.json();

    const notice = await db.query.notices.findFirst({
      where: eq(notices.id, id),
    });

    if (!notice) {
      return NextResponse.json({ error: 'Notice not found' }, { status: 404 });
    }

    const updatedNotice = await db
      .update(notices)
      .set({ title, content, updatedAt: new Date() })
      .where(eq(notices.id, id))
      .returning();

    return NextResponse.json(updatedNotice[0]);
  } catch (error) {
    console.error('Error updating notice:', error);
    return NextResponse.json({ error: 'Failed to update notice' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await db.delete(notices).where(eq(notices.id, id));

    return NextResponse.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('Error deleting notice:', error);
    return NextResponse.json({ error: 'Failed to delete notice' }, { status: 500 });
  }
} 