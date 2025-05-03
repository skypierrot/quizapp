import React from "react";

export default function StatisticsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">학습 통계</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* 요약 카드 1 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">총 학습 시간</h3>
            <span className="text-gray-500 text-sm">최근 30일</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">12시간 45분</p>
          <p className="text-sm text-gray-600 mt-2">지난 달 대비 +2시간 30분</p>
        </div>
        
        {/* 요약 카드 2 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">푼 문제</h3>
            <span className="text-gray-500 text-sm">총계</span>
          </div>
          <p className="text-3xl font-bold text-green-600">352 문항</p>
          <p className="text-sm text-gray-600 mt-2">지난 주 42문항 학습</p>
        </div>
        
        {/* 요약 카드 3 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">평균 정답률</h3>
            <span className="text-gray-500 text-sm">전체</span>
          </div>
          <p className="text-3xl font-bold text-purple-600">78.5%</p>
          <p className="text-sm text-gray-600 mt-2">지난 달 대비 +3.2%</p>
        </div>
      </div>
      
      {/* 과목별 통계 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">과목별 학습 통계</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">과목</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학습 문항</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">정답률</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">오답 문항</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">평균 소요시간</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium">정보처리기사</td>
                <td className="px-6 py-4 whitespace-nowrap">205문항</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="mr-2">82.4%</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2.5">
                      <div className="bg-green-600 h-2.5 rounded-full" style={{ width: "82.4%" }}></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">36문항</td>
                <td className="px-6 py-4 whitespace-nowrap">45초/문항</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium">정보보안기사</td>
                <td className="px-6 py-4 whitespace-nowrap">147문항</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="mr-2">74.8%</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2.5">
                      <div className="bg-green-600 h-2.5 rounded-full" style={{ width: "74.8%" }}></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">37문항</td>
                <td className="px-6 py-4 whitespace-nowrap">52초/문항</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 취약 분야 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">취약 분야 분석</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">정보처리기사 취약 분야</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">데이터베이스</span>
                  <span className="text-sm font-medium text-red-600">65.2%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-red-600 h-2.5 rounded-full" style={{ width: "65.2%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">소프트웨어 공학</span>
                  <span className="text-sm font-medium text-yellow-600">72.1%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-yellow-600 h-2.5 rounded-full" style={{ width: "72.1%" }}></div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">정보보안기사 취약 분야</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">암호학</span>
                  <span className="text-sm font-medium text-red-600">63.8%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-red-600 h-2.5 rounded-full" style={{ width: "63.8%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">네트워크 보안</span>
                  <span className="text-sm font-medium text-yellow-600">70.5%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-yellow-600 h-2.5 rounded-full" style={{ width: "70.5%" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 