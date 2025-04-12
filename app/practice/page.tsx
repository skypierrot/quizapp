import React from "react";

export default function PracticePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">문제 풀이</h1>
      
      <div className="mb-8">
        <div className="flex flex-wrap gap-4 mb-4">
          <select className="p-2 border rounded-md">
            <option value="">과목 선택</option>
            <option value="정보처리기사">정보처리기사</option>
            <option value="정보보안기사">정보보안기사</option>
          </select>
          
          <select className="p-2 border rounded-md">
            <option value="">연도 선택</option>
            <option value="2024">2024년</option>
            <option value="2023">2023년</option>
          </select>
          
          <select className="p-2 border rounded-md">
            <option value="">유형 선택</option>
            <option value="필기">필기</option>
            <option value="실기">실기</option>
          </select>
          
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            문제 풀기 시작
          </button>
        </div>
        
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800">
            <span className="font-semibold">참고:</span> 문제 풀이를 시작하면 자동으로 시간이 측정됩니다. 
            완료 후 결과를 저장하여 오답 노트와 통계에 반영할 수 있습니다.
          </p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">최근 풀이 기록</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">과목</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유형</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">문제 수</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">정답률</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">소요시간</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">2024-04-11</td>
                <td className="px-6 py-4 whitespace-nowrap">정보처리기사</td>
                <td className="px-6 py-4 whitespace-nowrap">필기</td>
                <td className="px-6 py-4 whitespace-nowrap">20문제</td>
                <td className="px-6 py-4 whitespace-nowrap">85%</td>
                <td className="px-6 py-4 whitespace-nowrap">15분 32초</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">2024-04-10</td>
                <td className="px-6 py-4 whitespace-nowrap">정보보안기사</td>
                <td className="px-6 py-4 whitespace-nowrap">필기</td>
                <td className="px-6 py-4 whitespace-nowrap">30문제</td>
                <td className="px-6 py-4 whitespace-nowrap">73%</td>
                <td className="px-6 py-4 whitespace-nowrap">25분 05초</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 