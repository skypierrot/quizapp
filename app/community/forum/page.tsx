import React from "react";
import Link from "next/link";

interface ForumPostProps {
  id: string;
  title: string;
  author: string;
  date: string;
  category: string;
  commentCount: number;
  viewCount: number;
}

const ForumPost: React.FC<ForumPostProps> = ({
  id, title, author, date, category, commentCount, viewCount
}) => {
  return (
    <div className="border-b border-gray-200 py-4">
      <div className="flex items-center mb-2">
        <span className="text-xs font-medium text-blue-600 bg-blue-100 rounded-full px-2 py-1 mr-2">
          {category}
        </span>
        <h3 className="text-lg font-medium hover:text-blue-600">
          <Link href={`/community/forum/${id}`}>{title}</Link>
        </h3>
      </div>
      <div className="flex items-center text-sm text-gray-500">
        <span className="mr-4">{author}</span>
        <span className="mr-4">{date}</span>
        <span className="mr-4">조회 {viewCount}</span>
        <span>댓글 {commentCount}</span>
      </div>
    </div>
  );
};

// 임시 데이터
const mockPosts = [
  {
    id: "1",
    title: "정보처리기사 실기 준비 방법 공유합니다",
    author: "tech_master",
    date: "2024-04-12",
    category: "정보처리기사",
    commentCount: 8,
    viewCount: 342
  },
  {
    id: "2",
    title: "네트워크 관리사 자격증 취득 후기",
    author: "network_pro",
    date: "2024-04-11",
    category: "네트워크관리사",
    commentCount: 5,
    viewCount: 217
  },
  {
    id: "3",
    title: "정보보안기사 문제 풀이 스터디 모집합니다",
    author: "security_learner",
    date: "2024-04-10",
    category: "정보보안기사",
    commentCount: 12,
    viewCount: 453
  },
  {
    id: "4",
    title: "데이터베이스 관련 문제 풀이 팁",
    author: "db_expert",
    date: "2024-04-09",
    category: "정보처리기사",
    commentCount: 6,
    viewCount: 289
  },
  {
    id: "5",
    title: "리눅스 마스터 시험 난이도 어떤가요?",
    author: "linux_newbie",
    date: "2024-04-08",
    category: "리눅스마스터",
    commentCount: 10,
    viewCount: 321
  }
];

export default function ForumPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">커뮤니티 포럼</h1>
        
        <div className="flex space-x-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            글쓰기
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <select className="p-2 border rounded-md">
            <option value="">카테고리 선택</option>
            <option value="정보처리기사">정보처리기사</option>
            <option value="정보보안기사">정보보안기사</option>
            <option value="네트워크관리사">네트워크관리사</option>
            <option value="리눅스마스터">리눅스마스터</option>
          </select>
          
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="검색어 입력"
              className="p-2 border rounded-md w-full"
            />
            <button className="absolute right-0 top-0 h-full px-4 text-gray-600 hover:text-gray-900">
              🔍
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="flex space-x-4">
            <button className="font-medium hover:text-blue-600">최신순</button>
            <button className="text-gray-500 hover:text-blue-600">인기순</button>
            <button className="text-gray-500 hover:text-blue-600">댓글순</button>
          </div>
          
          <div className="text-sm text-gray-500">
            전체 게시글: 125개
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {mockPosts.map((post) => (
            <div key={post.id} className="p-4">
              <ForumPost {...post} />
            </div>
          ))}
        </div>
        
        <div className="p-4 flex justify-center">
          <div className="flex space-x-1">
            <button className="w-9 h-9 rounded-md border flex items-center justify-center hover:bg-gray-100">
              &lt;
            </button>
            <button className="w-9 h-9 rounded-md border bg-blue-600 text-white flex items-center justify-center">
              1
            </button>
            <button className="w-9 h-9 rounded-md border flex items-center justify-center hover:bg-gray-100">
              2
            </button>
            <button className="w-9 h-9 rounded-md border flex items-center justify-center hover:bg-gray-100">
              3
            </button>
            <button className="w-9 h-9 rounded-md border flex items-center justify-center hover:bg-gray-100">
              4
            </button>
            <button className="w-9 h-9 rounded-md border flex items-center justify-center hover:bg-gray-100">
              5
            </button>
            <button className="w-9 h-9 rounded-md border flex items-center justify-center hover:bg-gray-100">
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 