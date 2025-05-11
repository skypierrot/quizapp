"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then(res => res.json());

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
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { data: threadData, mutate: mutateThread } = useSWR(`/api/threads/${id}`, fetcher);
  const { data: commentData, mutate: mutateComments } = useSWR(`/api/threads/${id}/comments`, fetcher);

  // 게시글 수정 상태
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // 댓글 작성/수정 상태
  const [comment, setComment] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [editCommentId, setEditCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");

  if (!threadData) return <div>로딩 중...</div>;
  if (threadData.message) return <div>{threadData.message}</div>;
  const thread = threadData.thread;

  // 게시글 수정 시작
  const handleEdit = () => {
    setEditTitle(thread.title);
    setEditContent(thread.content);
    setEditMode(true);
  };

  // 게시글 수정 저장
  const handleUpdate = async (e: any) => {
    e.preventDefault();
    await fetch(`/api/threads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, content: editContent }),
    });
    setEditMode(false);
    mutateThread();
  };

  // 게시글 삭제
  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await fetch(`/api/threads/${id}`, { method: "DELETE" });
    router.push("/community/forum");
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
  };

  // 댓글 수정 시작
  const handleEditComment = (c: any) => {
    setEditCommentId(c.id);
    setEditCommentContent(c.content);
  };

  // 댓글 수정 저장
  const handleUpdateComment = async (e: any, commentId: string) => {
    e.preventDefault();
    await fetch(`/api/threads/${id}/comments/${commentId}`, {
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
    await fetch(`/api/threads/${id}/comments/${commentId}`, { method: "DELETE" });
    mutateComments();
  };

  // 트리형 댓글 렌더링
  const renderComments = (comments: any[]) => (
    <ul>
      {comments.map(c => (
        <li key={c.id} className="mb-2">
          <div className="p-2 border rounded">
            <div className="font-bold">{c.authorId}</div>
            {editCommentId === c.id ? (
              <form onSubmit={e => handleUpdateComment(e, c.id)}>
                <textarea value={editCommentContent} onChange={e => setEditCommentContent(e.target.value)} className="w-full border rounded p-1 mb-1" />
                <button type="submit" className="btn btn-primary btn-xs mr-2">저장</button>
                <button type="button" onClick={() => setEditCommentId(null)} className="btn btn-outline btn-xs">취소</button>
              </form>
            ) : (
              <>
                <div>{c.content}</div>
                <div className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</div>
                {session?.user?.id === c.authorId && (
                  <span>
                    <button onClick={() => handleEditComment(c)} className="text-xs text-blue-500 mr-2">수정</button>
                    <button onClick={() => handleDeleteComment(c.id)} className="text-xs text-red-500">삭제</button>
                  </span>
                )}
                <button className="text-xs text-blue-500 ml-2" onClick={() => setParentId(c.id)}>답글</button>
              </>
            )}
          </div>
          {c.children && c.children.length > 0 && (
            <div className="ml-4">
              {renderComments(c.children)}
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const commentTree = buildCommentTree(commentData?.comments || []);

  return (
    <div className="container py-8">
      {editMode ? (
        <form onSubmit={handleUpdate} className="mb-6">
          <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full border rounded p-2 mb-2" />
          <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full border rounded p-2 mb-2" />
          <button type="submit" className="btn btn-primary mr-2">저장</button>
          <button type="button" onClick={() => setEditMode(false)} className="btn btn-outline">취소</button>
        </form>
      ) : (
        <>
          <h2 className="text-xl font-bold mb-2">{thread.title}</h2>
          <div className="mb-4">{thread.content}</div>
          <div className="text-sm text-gray-500 mb-8">{thread.authorId} | {new Date(thread.createdAt).toLocaleString()}</div>
          {session?.user?.id === thread.authorId && (
            <div className="flex gap-2 mb-4">
              <button onClick={handleEdit} className="btn btn-outline">수정</button>
              <button onClick={handleDelete} className="btn btn-danger">삭제</button>
            </div>
          )}
        </>
      )}

      <form onSubmit={handleSubmitComment} className="mb-6">
        {parentId && (
          <div className="mb-2 text-xs text-blue-600">
            대댓글 작성 중... <button type="button" onClick={() => setParentId(null)}>취소</button>
          </div>
        )}
        <textarea
          className="w-full border rounded p-2 mb-2"
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="댓글을 입력하세요"
        />
        <button type="submit" className="btn btn-primary">댓글 작성</button>
      </form>

      <h3 className="font-semibold mb-2">댓글</h3>
      {renderComments(commentTree)}
      <div className="mt-8">
        <Link href="/community/forum" className="text-blue-600 hover:underline">목록으로 돌아가기</Link>
      </div>
    </div>
  );
} 