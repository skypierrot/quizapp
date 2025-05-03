import React from "react";
import Link from "next/link";

interface ExamCardProps {
  id: string;
  title: string;
  year: number;
  subject: string;
  round: number;
  questionCount: number;
}

const ExamCard: React.FC<ExamCardProps> = ({ 
  id, title, year, subject, round, questionCount 
}) => {
  return (
    <Link href={`/exams/${id}`}>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {year}년
          </span>
          <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
            {subject}
          </span>
          <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
            {round}회차
          </span>
        </div>
        <p className="text-gray-600">문항 수: {questionCount}개</p>
      </div>
    </Link>
  );
};

// 임시 데이터
const mockExams = [
  {
    id: "1",
    title: "정보처리기사 필기",
    year: 2024,
    subject: "정보처리기사",
    round: 1,
    questionCount: 100
  },
  {
    id: "2",
    title: "정보보안기사 필기",
    year: 2024,
    subject: "정보보안기사",
    round: 1,
    questionCount: 100
  },
  {
    id: "3",
    title: "네트워크관리사 필기",
    year: 2024,
    subject: "네트워크관리사",
    round: 2,
    questionCount: 50
  }
];

export default function ExamsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">시험 목록</h1>
      
      <div className="mb-6">
        <div className="flex flex-wrap gap-4">
          <select className="p-2 border rounded-md">
            <option value="">연도 선택</option>
            <option value="2024">2024년</option>
            <option value="2023">2023년</option>
          </select>
          
          <select className="p-2 border rounded-md">
            <option value="">과목 선택</option>
            <option value="정보처리기사">정보처리기사</option>
            <option value="정보보안기사">정보보안기사</option>
          </select>
          
          <select className="p-2 border rounded-md">
            <option value="">회차 선택</option>
            <option value="1">1회차</option>
            <option value="2">2회차</option>
            <option value="3">3회차</option>
          </select>
          
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            필터 적용
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockExams.map((exam) => (
          <ExamCard key={exam.id} {...exam} />
        ))}
      </div>
    </div>
  );
} 