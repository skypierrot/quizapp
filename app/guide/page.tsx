import React from "react";

export default function GuidePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">시험 준비 가이드</h1>
      
      <div className="space-y-6">
        <section className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">시험 준비 방법</h2>
          <p className="mb-4">
            기술 자격증 시험을 효과적으로 준비하기 위한 방법을 안내합니다. 
            체계적인 학습 계획과 꾸준한 연습이 합격의 지름길입니다.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>시험 출제 경향 분석하기</li>
            <li>이론 공부와 실습 병행하기</li>
            <li>과거 기출문제 반복 풀기</li>
            <li>오답 노트 작성하기</li>
            <li>모의고사 시간 내에 풀어보기</li>
          </ul>
        </section>
        
        <section className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">플랫폼 활용 방법</h2>
          <p className="mb-4">
            본 플랫폼을 활용하여 효과적으로 학습하는 방법을 안내합니다.
          </p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>회원가입 후 관심 시험 과목 선택하기</li>
            <li>기출문제 풀이로 실력 진단하기</li>
            <li>오답 문제 집중 학습하기</li>
            <li>통계 기능으로 취약 분야 파악하기</li>
            <li>모의고사 기능으로 실전 감각 익히기</li>
          </ol>
        </section>
      </div>
    </div>
  );
} 