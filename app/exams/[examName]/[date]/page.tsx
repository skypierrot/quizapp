'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { IExamInstance } from '@/types';
import Breadcrumb from '@/components/common/Breadcrumb';
import { ExamSessionListDisplay, IDisplayItem } from '@/components/exam-selection/ExamSessionListDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface IExamInstancesResponse {
  examInstances: IExamInstance[];
}

// 변환 함수: 특정 날짜의 인스턴스 목록을 과목별 아이템 목록으로 변환
const transformInstancesToSubjectItems = (
  instances: IExamInstance[],
  encodedExamName: string,
  targetDate: string
): IDisplayItem[] => {
  if (!instances || instances.length === 0) return [];

  return instances
    .filter(instance => instance.date === targetDate) // 해당 날짜의 인스턴스만 필터링
    .map(instance => {
      const displayLabel = instance.subject; // 과목명
      // 모의고사 시작 URL
      const linkUrl = `/exams/start/${encodedExamName}/${instance.date}/${encodeURIComponent(instance.subject)}`;

      return {
        key: `${instance.date}-${instance.subject}`, // 고유 키
        displayLabel: displayLabel,
        countLabel: `문항 수: ${instance.questionCount}개`,
        linkUrl: linkUrl,
        date: instance.date,
        subject: instance.subject,
        questionCount: instance.questionCount,
      };
    })
    .sort((a, b) => a.subject!.localeCompare(b.subject!)); // 과목명 오름차순 정렬
};

// 새로운 변환 함수: 전체 인스턴스 목록에서 고유 과목 목록 아이템으로 변환 (과목별 시험 탭용)
const transformInstancesToGlobalSubjectItems = (
  instances: IExamInstance[],
  encodedExamName: string
): IDisplayItem[] => {
  if (!instances || instances.length === 0) return [];

  const subjectsMap = new Map<string, { count: number, totalQuestions: number }>();

  instances.forEach(instance => {
    if (!subjectsMap.has(instance.subject)) {
      subjectsMap.set(instance.subject, { count: 0, totalQuestions: 0 });
    }
    const subjectData = subjectsMap.get(instance.subject)!;
    subjectData.count += 1; // 해당 과목이 등장하는 회차 수
    subjectData.totalQuestions += instance.questionCount; // 해당 과목의 총 문제 수 (모든 회차 합산)
  });

  return Array.from(subjectsMap.entries()).map(([subject, data]) => {
    const linkUrl = `/exams/subject-test/${encodedExamName}/${encodeURIComponent(subject)}`;
    return {
      key: subject,
      displayLabel: subject,
      // countLabel: `총 ${data.count}개 회차 (총 ${data.totalQuestions}문항)`,
      countLabel: "전체 회차 문제 풀기", // 단순화된 레이블
      linkUrl: linkUrl,
      subject: subject,
    };
  }).sort((a, b) => a.subject!.localeCompare(b.subject!));
};

export default function ExamDateDetailPage() {
  const params = useParams();
  const [decodedExamName, setDecodedExamName] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<string | null>(null);
  const [subjectItemsForDateTab, setSubjectItemsForDateTab] = useState<IDisplayItem[]>([]); // 회차별 탭용
  const [allExamInstances, setAllExamInstances] = useState<IExamInstance[]>([]); // 전체 인스턴스 저장용
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("byDate"); // 탭 상태 추가

  useEffect(() => {
    const examNameParam = params?.examName;
    const dateParam = params?.date;

    if (typeof examNameParam === 'string' && typeof dateParam === 'string') {
      try {
        const decodedName = decodeURIComponent(examNameParam);
        setDecodedExamName(decodedName);
        setCurrentDate(dateParam);

        const fetchExamData = async () => {
          setLoading(true);
          setError(null);
          try {
            const apiUrl = '/api/exam-instances';
            const encodedTag = encodeURIComponent(`시험명:${decodedName}`);
            const response = await fetch(`${apiUrl}?tags=${encodedTag}`, { cache: 'no-store' });
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || `API 호출 실패: ${response.statusText}`);
            }
            const data: IExamInstancesResponse = await response.json();
            const fetchedInstances = data.examInstances || [];
            setAllExamInstances(fetchedInstances);

            const itemsForDate = transformInstancesToSubjectItems(fetchedInstances, examNameParam, dateParam);
            setSubjectItemsForDateTab(itemsForDate);

          } catch (err) {
            console.error(`모의고사 데이터 로딩 실패 (시험명: ${decodedName}, 날짜: ${dateParam}):`, err);
            setError(err instanceof Error ? err.message : "데이터를 불러오는 중 오류가 발생했습니다.");
            setAllExamInstances([]);
            setSubjectItemsForDateTab([]);
          } finally {
            setLoading(false);
          }
        };
        fetchExamData();
      } catch (e) {
        console.error("시험명 또는 날짜 파라미터 처리 오류:", e);
        setError("잘못된 URL 파라미터 형식입니다.");
        setLoading(false);
      }
    } else {
      setError("URL에서 시험명 또는 날짜를 찾을 수 없습니다.");
      setLoading(false);
    }
  }, [params]);

  const globalSubjectDisplayItems = useMemo(() => {
    const examNameParam = params?.examName;
    if (typeof examNameParam === 'string') {
      return transformInstancesToGlobalSubjectItems(allExamInstances, examNameParam);
    }
    return [];
  }, [allExamInstances, params?.examName]);

  if (loading) {
    return <div className="container mx-auto py-8 text-center">로딩 중...</div>;
  }
  if (error) {
    return <div className="container mx-auto py-8 text-center text-red-500">오류: {error}</div>;
  }

  const pageTitleByDate = decodedExamName && currentDate 
    ? `${decodedExamName} (${currentDate}) - 과목 선택` 
    : "과목 선택";
  const pageTitleBySubject = decodedExamName
    ? `${decodedExamName} - 전체 과목별 시험 보기`
    : "전체 과목별 시험 보기";
    
  const breadcrumbExamName = typeof params?.examName === 'string' ? params.examName : null;
  const breadcrumbDate = typeof params?.date === 'string' ? params.date : null;

  return (
    <div className="container mx-auto py-8">
      <Breadcrumb items={decodedExamName && breadcrumbExamName && breadcrumbDate ? [
        { label: '홈', href: '/' },
        { label: '모의고사', href: '/exams' },
        { label: decodedExamName, href: `/exams/${breadcrumbExamName}` }, 
        { label: breadcrumbDate, href: `/exams/${breadcrumbExamName}/${breadcrumbDate}`, isCurrent: true }, 
      ] : []} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="byDate">회차별 시험 ({currentDate || '날짜 로딩 중'})</TabsTrigger>
          <TabsTrigger value="bySubject">과목별 시험 (전체 회차)</TabsTrigger>
        </TabsList>
        <TabsContent value="byDate" className="mt-4">
          <ExamSessionListDisplay
            items={subjectItemsForDateTab}
            title={pageTitleByDate}
          />
        </TabsContent>
        <TabsContent value="bySubject" className="mt-4">
          <ExamSessionListDisplay
            items={globalSubjectDisplayItems}
            title={pageTitleBySubject}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 