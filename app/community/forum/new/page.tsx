"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForumNewPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const categories = ["정보처리기사", "정보보안기사", "네트워크관리사", "리눅스마스터"];

  // 태그 추가
  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  // 태그 제거
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Enter 키로 태그 추가
  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!title.trim() || !content.trim() || !category) {
      setError("제목, 카테고리, 내용을 모두 입력하세요.");
      return;
    }

    setLoading(true);
    
    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category, tags }),
      });

      if (res.ok) {
        router.push("/community/forum");
      } else {
        const data = await res.json();
        setError(data.message || "등록에 실패했습니다.");
      }
    } catch (err) {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">새 글 작성</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={200}
            />
            <div className="text-xs text-gray-500 mt-1">
              {title.length}/200
            </div>
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리 *
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">카테고리를 선택하세요</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* 태그 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              태그 (최대 5개)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyPress={handleTagInputKeyPress}
                placeholder="태그를 입력하고 Enter를 누르세요"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={20}
                disabled={tags.length >= 5}
              />
              <button
                type="button"
                onClick={addTag}
                disabled={!tagInput.trim() || tags.includes(tagInput.trim()) || tags.length >= 5}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                추가
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              태그는 검색과 분류에 도움이 됩니다. 예: 실기, 필기, 팁, 후기 등
            </div>
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              내용 *
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[200px] resize-y"
              maxLength={5000}
            />
            <div className="text-xs text-gray-500 mt-1">
              {content.length}/5000
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="text-red-700 text-sm">{error}</div>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-4 pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? "등록 중..." : "글 등록"}
            </button>
            <button 
              type="button" 
              onClick={() => router.back()} 
              disabled={loading}
              className="px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              취소
            </button>
          </div>
        </form>
      </div>

      {/* 작성 가이드 */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">📝 작성 가이드</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 명확하고 구체적인 제목을 작성해주세요</li>
          <li>• 적절한 카테고리를 선택해주세요</li>
          <li>• 태그를 활용하여 내용을 쉽게 찾을 수 있도록 해주세요</li>
          <li>• 다른 사용자에게 도움이 되는 내용을 작성해주세요</li>
          <li>• 욕설이나 부적절한 내용은 삼가해주세요</li>
        </ul>
      </div>
    </div>
  );
} 