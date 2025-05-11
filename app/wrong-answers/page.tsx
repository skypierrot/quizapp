import React from "react";
import Link from "next/link";

export default function WrongAnswersPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">오답 노트</h1>
      
      <div className="mb-8">
        <div className="flex flex-wrap gap-4 mb-4">
          <select className="p-2 border rounded-md">
            <option value="">과목 선택</option>
            <option value="정보처리기사">정보처리기사</option>
            <option value="정보보안기사">정보보안기사</option>
          </select>
          
          <select className="p-2 border rounded-md">
            <option value="">유형 선택</option>
            <option value="필기">필기</option>
            <option value="실기">실기</option>
          </select>
          
          <select className="p-2 border rounded-md">
            <option value="">정렬 기준</option>
            <option value="최신순">최신순</option>
            <option value="오답횟수">오답 횟수 순</option>
          </select>
          
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            필터 적용
          </button>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* 오답 문제 카드 1 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full mr-2">
                3회 오답
              </span>
              <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
                정보처리기사
              </span>
            </div>
            <div className="text-sm text-gray-500">
              마지막 오답: 2024-04-10
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Q. 데이터베이스 정규화의 목적으로 가장 옳은 것은?</h3>
            <ol className="list-decimal pl-6 space-y-1">
              <li className="text-gray-700">데이터의 중복을 최소화하기 위함</li>
              <li className="text-gray-700">데이터베이스의 성능을 향상시키기 위함</li>
              <li className="text-gray-700">데이터베이스의 용량을 줄이기 위함</li>
              <li className="text-gray-700">데이터베이스의 접근 속도를 높이기 위함</li>
            </ol>
          </div>
          
          <div className="mb-4">
            <div className="flex">
              <div className="text-sm font-medium text-green-600 mr-2">정답: 1</div>
              <div className="text-sm font-medium text-red-600">내 답안: 2</div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">해설</h4>
            <p className="text-sm text-blue-800">
              정규화는 데이터베이스 설계에서 중복을 최소화하고 데이터 무결성을 보장하기 위한 과정입니다. 
              정규화를 통해 데이터 중복을 줄이고, 갱신 이상을 방지할 수 있습니다.
            </p>
          </div>
        </div>
        
        {/* 오답 문제 카드 2 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full mr-2">
                1회 오답
              </span>
              <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
                정보보안기사
              </span>
            </div>
            <div className="text-sm text-gray-500">
              마지막 오답: 2024-04-09
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Q. 다음 중 대칭키 암호화 알고리즘이 아닌 것은?</h3>
            <ol className="list-decimal pl-6 space-y-1">
              <li className="text-gray-700">AES</li>
              <li className="text-gray-700">DES</li>
              <li className="text-gray-700">RSA</li>
              <li className="text-gray-700">Blowfish</li>
            </ol>
          </div>
          
          <div className="mb-4">
            <div className="flex">
              <div className="text-sm font-medium text-green-600 mr-2">정답: 3</div>
              <div className="text-sm font-medium text-red-600">내 답안: 4</div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">해설</h4>
            <p className="text-sm text-blue-800">
              RSA는 비대칭키(공개키) 암호화 알고리즘입니다. 나머지 AES, DES, Blowfish는 모두 대칭키 암호화 알고리즘입니다.
              대칭키 암호화는 암호화와 복호화에 동일한 키를 사용하지만, 비대칭키 암호화는 암호화와 복호화에 서로 다른 키를 사용합니다.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-center">
        <Link href="/learn/review-quiz">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
            오답 문제 다시 풀기
          </button>
        </Link>
      </div>
    </div>
  );
} 