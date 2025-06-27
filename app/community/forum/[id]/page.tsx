"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

// 트리형 댓글 변환 함수
function buildCommentTree(comments: any[]) {
  const map = new Map();
  const roots: any[] = [];
  comments.forEach(comment => map.set(comment.id, { ...comment, children: [] }));
  comments.forEach(comment => {
    if (comment.parentId) {
      const parent = map.get(comment.parentId);
      if (parent) parent.children.push(map.get(comment.id));
    } else {
      roots.push(map.get(comment.id));
    }
  });
  return roots;
}

export default function ThreadDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { data: session } = useSession();
  const { data: threadData, mutate: mutateThread } = useSWR(`/api/threads/${id}`, fetcher);
  const { data: commentData, mutate: mutateComments } = useSWR(`/api/threads/${id}/comments`, fetcher);
  const { data: bookmarkData, mutate: mutateBookmark } = useSWR(
    session ? `/api/threads/${id}/bookmark` : null, 
    fetcher
  );

  // 게시글 수정 상태
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // 댓글 작성/수정 상태
  const [comment, setComment] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [editCommentId, setEditCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");

  if (!threadData) return <div className="flex justify-center py-8">로딩 중...</div>;
  if (threadData.message) return <div className="flex justify-center py-8">{threadData.message}</div>;
  
  const thread = threadData.thread;

  // 게시글 수정 시작
  const handleEdit = () => {
    setEditTitle(thread.title);
    setEditContent(thread.content);
    setEditTags(thread.tags || []);
    setEditMode(true);
  };

  // 태그 추가/제거
  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !editTags.includes(trimmedTag) && editTags.length < 5) {
      setEditTags([...editTags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(tag => tag !== tagToRemove));
  };

  // 게시글 수정 저장
  const handleUpdate = async (e: any) => {
    e.preventDefault();
    await fetch(`/api/threads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, content: editContent, tags: editTags }),
    });
    setEditMode(false);
    mutateThread();
  };

  // 게시글 삭제
  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const response = await fetch(`/api/threads/${id}`, { method: "DELETE" });
    if (response.ok) {
      router.push("/community/forum");
    }
  };

  // 북마크 토글
  const handleBookmark = async () => {
    if (!session) {
      alert("로그인이 필요합니다.");
      return;
    }
    await fetch(`/api/threads/${id}/bookmark`, { method: "POST" });
    mutateBookmark();
  };

  // 댓글 작성
  const handleSubmitComment = async (e: any) => {
    e.preventDefault();
    if (!comment.trim()) return;
    await fetch(`/api/threads/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: comment, parentId }),
    });
    setComment("");
    setParentId(null);
    mutateComments();
    mutateThread(); // 댓글 수 업데이트를 위해
  };

  // 댓글 수정 시작
  const handleEditComment = (c: any) => {
    setEditCommentId(c.id);
    setEditCommentContent(c.content);
  };

  // 댓글 수정 저장
  const handleUpdateComment = async (e: any, commentId: string) => {
    e.preventDefault();
    await fetch(`/api/threads/${id}/comments?commentId=${commentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editCommentContent }),
    });
    setEditCommentId(null);
    setEditCommentContent("");
    mutateComments();
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    await fetch(`/api/threads/${id}/comments?commentId=${commentId}`, { method: "DELETE" });
    mutateComments();
    mutateThread(); // 댓글 수 업데이트를 위해
  };

  // 트리형 댓글 렌더링
  const renderComments = (comments: any[], depth = 0) => (
    <div className={depth > 0 ? "ml-6 border-l-2 border-gray-200 pl-4" : ""}>
      {comments.map(c => (
        <div key={c.id} className="mb-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{c.authorId}</span>
                <span className="text-xs text-gray-500">
                  {new Date(c.createdAt).toLocaleString()}
                  {c.updatedAt !== c.createdAt && " (수정됨)"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {session?.user?.id === c.authorId && (
                  <>
                    <button 
                      onClick={() => handleEditComment(c)} 
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      수정
                    </button>
                    <button 
                      onClick={() => handleDeleteComment(c.id)} 
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      삭제
                    </button>
                  </>
                )}
                <button 
                  className="text-xs text-gray-600 hover:text-gray-800" 
                  onClick={() => setParentId(c.id)}
                >
                  답글
                </button>
              </div>
            </div>
            
            {editCommentId === c.id ? (
              <form onSubmit={e => handleUpdateComment(e, c.id)} className="space-y-2">
                <textarea 
                  value={editCommentContent} 
                  onChange={e => setEditCommentContent(e.target.value)} 
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                    저장
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEditCommentId(null)} 
                    className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                  >
                    취소
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-gray-800 whitespace-pre-wrap">{c.content}</div>
            )}
          </div>
          
          {c.children && c.children.length > 0 && (
            <div className="mt-2">
              {renderComments(c.children, depth + 1)}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const commentTree = buildCommentTree(commentData?.comments || []);

  return (
    <div className="container py-8 max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {editMode ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <input 
              value={editTitle} 
              onChange={e => setEditTitle(e.target.value)} 
              className="w-full p-3 text-xl font-bold border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="제목"
            />
            
            {/* 태그 편집 */}
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {editTags.map(tag => (
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
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="태그 추가"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={20}
                  disabled={editTags.length >= 5}
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={!tagInput.trim() || editTags.includes(tagInput.trim()) || editTags.length >= 5}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50"
                >
                  추가
                </button>
              </div>
            </div>
            
            <textarea 
              value={editContent} 
              onChange={e => setEditContent(e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px]"
              placeholder="내용"
            />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                저장
              </button>
              <button 
                type="button" 
                onClick={() => setEditMode(false)} 
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                취소
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* 게시글 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {thread.category}
                </span>
                {thread.isPinned && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                    📌 고정
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {session && (
                  <button
                    onClick={handleBookmark}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      bookmarkData?.bookmarked 
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {bookmarkData?.bookmarked ? '⭐ 북마크됨' : '☆ 북마크'}
                  </button>
                )}
              </div>
            </div>

            {/* 제목 */}
            <h1 className="text-2xl font-bold mb-4">{thread.title}</h1>
            
            {/* 태그 */}
            {thread.tags && thread.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {thread.tags.map((tag: string) => (
                  <Link
                    key={tag}
                    href={`/community/forum?tag=${tag}`}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
            
            {/* 내용 */}
            <div className="prose max-w-none mb-6">
              <div className="whitespace-pre-wrap text-gray-800">{thread.content}</div>
            </div>
            
            {/* 게시글 정보 */}
            <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-4">
              <div className="flex items-center gap-4">
                <span>작성자: {thread.authorId}</span>
                <span>작성일: {new Date(thread.createdAt).toLocaleString()}</span>
                {thread.updatedAt !== thread.createdAt && (
                  <span>수정일: {new Date(thread.updatedAt).toLocaleString()}</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span>👁️ {thread.viewCount}</span>
                <span>💬 {thread.commentCount}</span>
                <span>👍 {thread.voteCount}</span>
              </div>
            </div>
            
            {/* 작성자 액션 버튼 */}
            {session?.user?.id === thread.authorId && (
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={handleEdit} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  수정
                </button>
                <button 
                  onClick={handleDelete} 
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  삭제
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 댓글 작성 */}
      {session ? (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="font-semibold mb-4">댓글 작성</h3>
          <form onSubmit={handleSubmitComment}>
            {parentId && (
              <div className="mb-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                답글 작성 중... 
                <button 
                  type="button" 
                  onClick={() => setParentId(null)}
                  className="ml-2 text-blue-800 hover:text-blue-900"
                >
                  취소
                </button>
              </div>
            )}
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="댓글을 입력하세요"
              rows={4}
            />
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              댓글 작성
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 mb-6 text-center">
          <p className="text-gray-600 mb-4">댓글을 작성하려면 로그인이 필요합니다.</p>
          <Link 
            href="/api/auth/signin" 
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            로그인
          </Link>
        </div>
      )}

      {/* 댓글 목록 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-semibold mb-4">
          댓글 ({commentData?.comments?.length || 0})
        </h3>
        {commentTree.length > 0 ? (
          renderComments(commentTree)
        ) : (
          <p className="text-gray-500 text-center py-8">첫 번째 댓글을 작성해보세요!</p>
        )}
      </div>

      {/* 목록으로 돌아가기 */}
      <div className="mt-6 text-center">
        <Link 
          href="/community/forum" 
          className="inline-block px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          목록으로 돌아가기
        </Link>
      </div>
    </div>
  );
} 