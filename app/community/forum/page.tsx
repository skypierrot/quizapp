"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ForumPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [tag, setTag] = useState("");
  
  const limit = 10;
  
  // API 쿼리 파라미터 구성
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(category && { category }),
    ...(sortBy && { sortBy }),
    ...(tag && { tag }),
  });
  
  const { data, isLoading } = useSWR(`/api/threads?${queryParams}`, fetcher);

  // 투표 핸들러
  const handleVote = async (threadId: string, value: 1 | -1) => {
    await fetch(`/api/threads/${threadId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    mutate(`/api/threads?${queryParams}`);
  };

  // 검색 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // 검색 시 첫 페이지로 이동
    mutate(`/api/threads?${queryParams}`);
  };

  // 필터/정렬 변경 핸들러
  const handleFilterChange = (newCategory: string, newSortBy: string) => {
    setCategory(newCategory);
    setSortBy(newSortBy);
    setPage(1);
  };

  if (isLoading) return <div className="flex justify-center py-8">로딩 중...</div>;
  if (!data) return <div className="flex justify-center py-8">데이터 없음</div>;

  const categories = ["정보처리기사", "정보보안기사", "네트워크관리사", "리눅스마스터"];
  const sortOptions = [
    { value: "latest", label: "최신순" },
    { value: "popular", label: "인기순" },
    { value: "views", label: "조회순" },
    { value: "comments", label: "댓글순" },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">커뮤니티 포럼</h1>
        <Link 
          href="/community/forum/new" 
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          글쓰기
        </Link>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-4">
          <input
            type="text"
            placeholder="제목이나 내용으로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            검색
          </button>
        </form>
        
        <div className="flex flex-wrap gap-4">
          {/* 카테고리 필터 */}
          <select
            value={category}
            onChange={(e) => handleFilterChange(e.target.value, sortBy)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 카테고리</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* 정렬 옵션 */}
          <select
            value={sortBy}
            onChange={(e) => handleFilterChange(category, e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          {/* 현재 필터 표시 */}
          {(search || category || tag) && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">필터:</span>
              {search && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  검색: {search}
                </span>
              )}
              {category && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  {category}
                </span>
              )}
              {tag && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                  #{tag}
                </span>
              )}
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("");
                  setTag("");
                  setPage(1);
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                전체 초기화
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 게시글 목록 */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="divide-y divide-gray-200">
          {data.threads.map((post: any) => (
            <div key={post.id} className="p-4 flex gap-4 items-start hover:bg-gray-50 transition-colors">
              {/* 투표 버튼 */}
              <div className="flex flex-col items-center mr-2 select-none">
                <button 
                  onClick={() => handleVote(post.id, 1)} 
                  className="text-xl text-gray-500 hover:text-blue-600 transition-colors"
                >
                  ▲
                </button>
                <span className="font-bold text-base">{post.voteCount}</span>
                <button 
                  onClick={() => handleVote(post.id, -1)} 
                  className="text-xl text-gray-500 hover:text-red-600 transition-colors"
                >
                  ▼
                </button>
              </div>
              
              {/* 게시글 내용 */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {post.isPinned && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                      📌 고정
                    </span>
                  )}
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                    {post.category}
                  </span>
                  {post.tags && post.tags.map((tag: string) => (
                    <button
                      key={tag}
                      onClick={() => setTag(tag)}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-colors"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
                
                <Link 
                  href={`/community/forum/${post.id}`} 
                  className="font-medium text-lg hover:text-blue-600 transition-colors block mb-2"
                >
                  {post.title}
                </Link>
                
                <div className="text-gray-700 text-sm mb-3 line-clamp-2">
                  {post.content}
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span>{post.authorId}</span>
                    <span>{new Date(post.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      👁️ {post.viewCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      💬 {post.commentCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* 페이지네이션 */}
        <div className="p-4 flex justify-center items-center gap-2">
          <button 
            onClick={() => setPage(page - 1)} 
            disabled={page === 1} 
            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            이전
          </button>
          <span className="px-3 py-1">
            {page} / {data.totalPages}
          </span>
          <button 
            onClick={() => setPage(page + 1)} 
            disabled={page === data.totalPages} 
            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            다음
          </button>
        </div>
      </div>

      {/* 통계 정보 */}
      <div className="mt-6 text-center text-sm text-gray-500">
        총 {data.total}개의 게시글
        {search && ` (검색: "${search}")`}
        {category && ` (카테고리: ${category})`}
      </div>
    </div>
  );
} 