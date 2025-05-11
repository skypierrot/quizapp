"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ForumPage() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading } = useSWR(`/api/threads?page=${page}&limit=${limit}`, fetcher);

  // 투표 핸들러
  const handleVote = async (threadId: string, value: 1 | -1) => {
    await fetch(`/api/threads/${threadId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    mutate(`/api/threads?page=${page}&limit=${limit}`);
  };

  if (isLoading) return <div>로딩 중...</div>;
  if (!data) return <div>데이터 없음</div>;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">커뮤니티 포럼</h1>
        <Link href="/community/forum/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          글쓰기
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow-md">
        <div className="divide-y divide-gray-200">
          {data.threads.map((post: any) => (
            <div key={post.id} className="p-4 flex gap-4 items-start">
              <div className="flex flex-col items-center mr-2 select-none">
                <button onClick={() => handleVote(post.id, 1)} className="text-xl text-gray-500 hover:text-blue-600">▲</button>
                <span className="font-bold text-base">{post.voteCount}</span>
                <button onClick={() => handleVote(post.id, -1)} className="text-xl text-gray-500 hover:text-red-600">▼</button>
              </div>
              <div className="flex-1">
                <Link href={`/community/forum/${post.id}`} className="font-medium text-lg hover:text-blue-600">
                  {post.title}
                </Link>
                <div className="text-gray-700 text-sm mt-1 line-clamp-2">{post.content}</div>
                <div className="text-sm text-gray-500">{post.authorId} | {new Date(post.createdAt).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 flex justify-center gap-2">
          <button onClick={() => setPage(page-1)} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">이전</button>
          <span>{page}</span>
          <button onClick={() => setPage(page+1)} disabled={page === data.totalPages} className="px-3 py-1 border rounded disabled:opacity-50">다음</button>
        </div>
      </div>
    </div>
  );
} 