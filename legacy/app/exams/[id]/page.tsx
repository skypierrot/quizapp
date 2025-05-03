import React from "react";
import Link from "next/link";

// 임시 데이터
async function getExamById(id: string) {
  return {
    id,
    title: "정보처리기사 필기 2024년 1회차",
    subject: "정보처리기사",
    type: "필기",
    year: 2024,
    round: 1,
    questionCount: 100,
    totalTime: 150, // 분 단위
    passScore: 60,
    description: "한국산업인력공단에서 시행하는 정보처리기사 필기시험입니다. 총 100문항으로 구성되어 있으며, 과목별로 20문항씩 출제됩니다.",
    sections: [
      {
        id: "1",
        title: "소프트웨어 설계",
        questionCount: 20,
        avgScore: 75
      },
      {
        id: "2",
        title: "소프트웨어 개발",
        questionCount: 20,
        avgScore: 68
      },
      {
        id: "3",
        title: "데이터베이스 구축",
        questionCount: 20,
        avgScore: 72
      },
      {
        id: "4",
        title: "프로그래밍 언어 활용",
        questionCount: 20,
        avgScore: 81
      },
      {
        id: "5",
        title: "정보시스템 구축관리",
        questionCount: 20,
        avgScore: 70
      }
    ]
  };
}

interface ExamPageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function ExamPage({ params }: ExamPageProps) {""
  const examId = params.id;
  const exam = await getExamById(examId);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/exams" className="text-blue-600 hover:underline flex items-center">
          <span className="mr-1">←</span> 시험 목록으로 돌아가기
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-3xl font-bold mb-4">{exam.title}</h1>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
            {exam.year}년
          </span>
          <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
            {exam.subject}
          </span>
          <span className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
            {exam.round}회차
          </span>
          <span className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
            {exam.type}
          </span>
        </div>
        
        <p className="text-gray-700 mb-6">{exam.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="border border-gray-200 rounded-md p-4">
            <h3 className="text-lg font-semibold mb-2">총 문항</h3>
            <p className="text-3xl font-bold text-blue-600">{exam.questionCount}문항</p>
          </div>
          
          <div className="border border-gray-200 rounded-md p-4">
            <h3 className="text-lg font-semibold mb-2">시험 시간</h3>
            <p className="text-3xl font-bold text-green-600">{exam.totalTime}분</p>
          </div>
          
          <div className="border border-gray-200 rounded-md p-4">
            <h3 className="text-lg font-semibold mb-2">합격 점수</h3>
            <p className="text-3xl font-bold text-purple-600">{exam.passScore}점</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">시험 과목</h2>
        
        <div className="space-y-4">
          {exam.sections.map((section) => (
            <div key={section.id} className="border border-gray-200 rounded-md p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">{section.title}</h3>
                <span className="text-sm text-gray-500">{section.questionCount}문항</span>
              </div>
              
              <div className="flex items-center">
                <div className="mr-2 text-sm">평균 정답률:</div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${section.avgScore}%` }}
                  ></div>
                </div>
                <div className="text-sm font-medium">{section.avgScore}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center space-x-4">
        <button className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 flex items-center">
          <span className="mr-2">✏️</span> 문제 풀기
        </button>
        
        <button className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 flex items-center">
          <span className="mr-2">📊</span> 통계 보기
        </button>
      </div>
    </div>
  );
} 