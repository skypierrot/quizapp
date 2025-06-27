"use client";

import useSWR from 'swr';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function NoticePage() {
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading, error } = useSWR(`/api/notices?page=${page}&limit=${limit}`, fetcher);

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error.message}</div>;
  if (!data || !data.notices || data.notices.length === 0) return <div>공지사항이 없습니다.</div>;

  return (
    <div className="container py-8 px-4 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">공지사항</h1>
        {session?.user?.role === 'admin' && (
          <Link href="/community/notice/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            공지 작성
          </Link>
        )}
      </div>
      <div className="space-y-4">
        {data.notices.map((notice: any) => (
          <div key={notice.id} className="p-4 border rounded-lg shadow-sm">
            <Link href={`/community/notice/${notice.id}`}>
              <h2 className="text-lg font-medium hover:underline">{notice.title}</h2>
            </Link>
            <p className="text-gray-600 mt-2">{new Date(notice.createdAt).toLocaleDateString()}</p>
            <p className="text-gray-500 text-sm mt-2 line-clamp-2">{notice.content}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-8 gap-2">
        <button onClick={() => setPage(page - 1)} disabled={page === 1} className="btn btn-outline">이전</button>
        <span>{page}</span>
        <button onClick={() => setPage(page + 1)} disabled={data.notices.length < limit} className="btn btn-outline">다음</button>
      </div>
    </div>
  );
} 