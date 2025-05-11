"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForumNewPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim() || !content.trim() || !category) {
      setError("제목, 카테고리, 내용을 모두 입력하세요.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, category }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/community/forum");
    } else {
      const data = await res.json();
      setError(data.message || "등록에 실패했습니다.");
    }
  };

  return (
    <div className="container py-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">글쓰기</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="제목"
          className="w-full border p-2 rounded"
        />
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="">카테고리 선택</option>
          <option value="정보처리기사">정보처리기사</option>
          <option value="정보보안기사">정보보안기사</option>
          <option value="네트워크관리사">네트워크관리사</option>
          <option value="리눅스마스터">리눅스마스터</option>
        </select>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="내용"
          className="w-full border p-2 rounded min-h-[120px]"
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "등록 중..." : "등록"}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => router.back()} disabled={loading}>
            취소
          </button>
        </div>
      </form>
    </div>
  );
} 