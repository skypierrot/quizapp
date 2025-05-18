'use client';

import * as React from 'react';
const { useEffect, useState } = React;

import { useParams } from 'next/navigation';
// import Link from 'next/link'; // Link는 공통 컴포넌트 내부에서 사용됨
// import { Card, CardHeader } from '@/components/ui/card'; // Card 관련 import 제거
import { IExamInstance } from '@/types';
import Breadcrumb from '@/components/common/Breadcrumb';
import { ExamSessionListDisplay, IDisplayItem } from '@/components/exam-selection/ExamSessionListDisplay'; // IDisplayItem import
// Tabs 컴포넌트 import 추가
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface IExamInstancesResponse { // 이 인터페이스는 API 응답 형식이므로 유지하거나 types로 이동
  examInstances: IExamInstance[];
}

// 날짜별로 그룹화된 데이터의 인터페이스
interface IAggregatedExamDate {
  date: string;
  totalQuestionCount: number;
  subjects: string[]; // 해당 날짜에 포함된 과목 목록 (필요시 사용)
}

export default function LearnExamDateListPage() { // 컴포넌트 이름 변경 (의미 명확화)
  const params = useParams();
  const examNameParam = params?.examName as string | undefined; // 타입 단언

  const [decodedExamName, setDecodedExamName] = useState<string | null>(null);
  // const [examInstances, setExamInstances] = useState<IExamInstance[]>([]); // 기존 상태 제거
  const [aggregatedExamDates, setAggregatedExamDates] = useState<IAggregatedExamDate[]>([]); // 새 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (examNameParam && typeof examNameParam === 'string') {
      try {
        // 이중 인코딩된 경우를 처리하기 위해 decodeURIComponent를 여러 번 시도할 수 있도록 수정
        let tempDecodedName = decodeURIComponent(examNameParam);
        // 첫 번째 디코딩 후에도 %가 남아있고, 일반적인 공백(%20)이 아닌 다른 인코딩 문자가 있다면 추가 디코딩 시도
        if (tempDecodedName.includes('%') && !/^[^%]+$/.test(tempDecodedName.replace(/%20/g, ''))) {
          try {
            tempDecodedName = decodeURIComponent(tempDecodedName);
          } catch (innerError) {
            // 내부 디코딩 실패 시 경고만 하고 첫 번째 디코딩 값 사용 (선택적)
            console.warn('Inner decodeURIComponent failed for examNameParam, using first decoded value:', examNameParam, innerError);
          }
        }
        const finalDecodedName = tempDecodedName;
        setDecodedExamName(finalDecodedName);

        const fetchAndProcessExamData = async () => {
          setLoading(true);
          setError(null);
          try {
            const apiUrl = '/api/exam-instances';
            // API 호출 시에는 디코딩된 이름을 사용하되, 태그 값으로 인코딩
            const encodedTag = encodeURIComponent(`시험명:${finalDecodedName}`);
            const response = await fetch(`${apiUrl}?tags=${encodedTag}`, { cache: 'no-store' });
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || `API 호출 실패: ${response.statusText}`);
            }
            
            const data: IExamInstancesResponse = await response.json();
            // console.log('[fetchAndProcessExamData] Raw Exam Instances Received:', JSON.stringify(data.examInstances, null, 2)); // 원본 데이터 로그 추가
            
            const filteredRawInstances = (data.examInstances || []).filter(instance => instance.questionCount > 0);
            // console.log('[fetchAndProcessExamData] Filtered Instances (questionCount > 0):', JSON.stringify(filteredRawInstances, null, 2)); // 필터링 후 데이터 로그 추가

            // 날짜 기준으로 그룹화 및 합산
            const groupedByDate: Record<string, IAggregatedExamDate> = {};
            for (const instance of filteredRawInstances) {
              if (!groupedByDate[instance.date]) {
                groupedByDate[instance.date] = {
                  date: instance.date,
                  totalQuestionCount: 0,
                  subjects: [],
                };
              }
              groupedByDate[instance.date].totalQuestionCount += instance.questionCount;
              if (!groupedByDate[instance.date].subjects.includes(instance.subject)) {
                groupedByDate[instance.date].subjects.push(instance.subject);
              }
            }
            
            const aggregatedData = Object.values(groupedByDate).sort((a, b) => b.date.localeCompare(a.date)); // 날짜 내림차순 정렬
            setAggregatedExamDates(aggregatedData);

          } catch (err) {
            console.error("Exam data loading/processing failed:", err);
            setError(err instanceof Error ? err.message : "데이터를 불러오는 중 오류가 발생했습니다.");
            setAggregatedExamDates([]);
          } finally {
            setLoading(false);
          }
        };
        fetchAndProcessExamData();
      } catch (e) {
        console.error("Error decoding exam name:", e);
        setError("잘못된 시험명 형식입니다.");
        setLoading(false);
      }
    } else if (examNameParam === undefined && params) { // examNameParam이 없는 경우 (예: params는 있지만 examName이 없을 때)
      setError("시험명을 URL에서 찾을 수 없습니다.");
      setLoading(false);
    }
  }, [examNameParam, params]); // 의존성 배열에 params도 포함

  const breadcrumbItems = decodedExamName ? [
    { label: '홈', href: '/' },
    { label: '문제 은행', href: '/learn/exams' },
    // label에는 디코딩된 이름을, href에는 인코딩된 이름을 사용
    { label: decodedExamName, href: `/learn/exams/${encodeURIComponent(decodedExamName)}`, isCurrent: true },
  ] : [];

  if (loading) {
    return <div className="container mx-auto py-8 text-center">로딩 중...</div>;
  }
  if (error) {
    return <div className="container mx-auto py-8 text-center text-red-500">오류: {error}</div>;
  }

  // IAggregatedExamDate[]를 IDisplayItem[]으로 변환
  const displayItems: IDisplayItem[] = aggregatedExamDates.map((aggDate): IDisplayItem => {
    const displayDateLabel = aggDate.date;
    const encodedDate = encodeURIComponent(aggDate.date);
    let linkUrl: string = '#'; // 타입 string으로 명시, 기본 URL

    if (typeof decodedExamName === 'string') { // 타입 가드를 통해 null이 아님을 확인
      const encodedExam = encodeURIComponent(decodedExamName);
      // study 페이지로 연결하도록 URL 변경 (날짜별)
      linkUrl = `/learn/exams/${encodedExam}/study?date=${encodedDate}`;
    }

    return {
      key: aggDate.date,
      displayLabel: displayDateLabel,
      countLabel: `총 문항 수: ${aggDate.totalQuestionCount}개`,
      linkUrl: linkUrl, 
      date: aggDate.date,
      questionCount: aggDate.totalQuestionCount,
      // subjects: aggDate.subjects, // 필요하다면 IDisplayItem에 subjects 추가 후 사용
    };
  });

  return (
    <div className="container mx-auto py-8">
      <Breadcrumb items={breadcrumbItems} />
      {/* Tabs 컴포넌트 추가 */}
      <Tabs defaultValue="byDate" className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="byDate">시험 회차별 학습</TabsTrigger>
          <TabsTrigger value="bySubject">과목별 학습</TabsTrigger>
        </TabsList>
        <TabsContent value="byDate" className="mt-4">
          <ExamSessionListDisplay
            items={displayItems}
            title={decodedExamName ? `${decodedExamName} - 시험 회차별 문제 목록` : "시험 회차별 문제 목록"}
          />
        </TabsContent>
        <TabsContent value="bySubject" className="mt-4">
          <div className="p-4 border rounded-md bg-white shadow">
            <h2 className="text-lg font-semibold mb-2">과목별 학습</h2>
            <p>선택된 과목의 모든 문제를 모아 학습합니다. (구현 예정)</p>
            {/* 여기에 과목 선택 UI 및 문제 목록 표시 로직 추가 예정 */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 