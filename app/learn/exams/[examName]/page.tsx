'use client';

import * as React from 'react';
const { useEffect, useState, useMemo } = React;

import { useParams } from 'next/navigation';
import Link from 'next/link'; // Link 추가
// import { Card, CardHeader } from '@/components/ui/card'; // Card 관련 import 제거
import { IExamInstance } from '@/types';
import Breadcrumb from '@/components/common/Breadcrumb';
import { ExamSessionListDisplay, IDisplayItem } from '@/components/exam-selection/ExamSessionListDisplay'; // IDisplayItem import
// Tabs 컴포넌트 import 추가
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Switch, Label, Button 컴포넌트 import 추가
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
  const [decodedExamName, setDecodedExamName] = useState<string | null>(null);
  const [aggregatedExamDates, setAggregatedExamDates] = useState<IAggregatedExamDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 과목별 학습을 위한 상태 추가
  const [allSubjects, setAllSubjects] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // 1. 원시 시험 데이터 상태 추가
  const [rawExamInstances, setRawExamInstances] = useState<IExamInstance[]>([]);

  const examNameParam = params?.examName as string | undefined; // 타입 단언

  useEffect(() => {
    if (examNameParam && typeof examNameParam === 'string') {
      try {
        let tempDecodedName = decodeURIComponent(examNameParam);
        if (tempDecodedName.includes('%') && !/^[^%]+$/.test(tempDecodedName.replace(/%20/g, ''))) {
          try {
            tempDecodedName = decodeURIComponent(tempDecodedName);
          } catch (innerError) {
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
            const encodedTag = encodeURIComponent(`시험명:${finalDecodedName}`);
            const response = await fetch(`${apiUrl}?tags=${encodedTag}`, { cache: 'no-store' });
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || `API 호출 실패: ${response.statusText}`);
            }
            
            const data: IExamInstancesResponse = await response.json();
            const filteredRawInstances = (data.examInstances || []).filter(instance => instance.questionCount > 0);
            setRawExamInstances(filteredRawInstances);

            const groupedByDate: Record<string, IAggregatedExamDate> = {};
            const subjectsSet = new Set<string>(); // 고유 과목을 수집하고 가나다순 정렬하기 위해 Set을 다시 사용합니다.

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
              subjectsSet.add(instance.subject); // Set에 과목명을 추가합니다.
            }
            
            const aggregatedData = Object.values(groupedByDate).sort((a, b) => b.date.localeCompare(a.date));
            setAggregatedExamDates(aggregatedData);
            setAllSubjects(Array.from(subjectsSet).sort()); // Set에서 배열을 만들어 가나다순으로 정렬합니다.

          } catch (err) {
            console.error("Exam data loading/processing failed:", err);
            setError(err instanceof Error ? err.message : "데이터를 불러오는 중 오류가 발생했습니다.");
            setAggregatedExamDates([]);
            setAllSubjects([]);
            setRawExamInstances([]);
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
    } else if (examNameParam === undefined && params) {
      setError("시험명을 URL에서 찾을 수 없습니다.");
      setLoading(false);
    }
  }, [examNameParam, params]);

  const breadcrumbItems = useMemo(() => {
    if (!decodedExamName) return [
        { label: '홈', href: '/' },
        { label: '문제 은행', href: '/learn/exams' },
        { label: '로딩 중...', isCurrent: true },
    ];
    return [
        { label: '홈', href: '/' },
        { label: '문제 은행', href: '/learn/exams' },
        { label: decodedExamName, href: `/learn/exams/${encodeURIComponent(decodedExamName)}`, isCurrent: true },
    ];
  }, [decodedExamName]);

  // IAggregatedExamDate[]를 IDisplayItem[]으로 변환 (날짜별 학습용)
  const displayItemsByDate: IDisplayItem[] = useMemo(() => aggregatedExamDates.map((aggDate): IDisplayItem => {
    const displayDateLabel = aggDate.date;
    const encodedDate = encodeURIComponent(aggDate.date);
    let linkUrl: string = '#';

    if (typeof decodedExamName === 'string') {
      const encodedExam = encodeURIComponent(decodedExamName);
      linkUrl = `/learn/exams/${encodedExam}/study?date=${encodedDate}`;
    }

    return {
      key: aggDate.date,
      displayLabel: displayDateLabel,
      countLabel: `총 문항 수: ${aggDate.totalQuestionCount}개`,
      linkUrl: linkUrl, 
      date: aggDate.date,
      questionCount: aggDate.totalQuestionCount,
    };
  }), [aggregatedExamDates, decodedExamName]);

  // 과목 선택 핸들러
  const handleSubjectSelection = (subject: string, checked: boolean) => {
    setSelectedSubjects(prev => 
      checked ? [...prev, subject] : prev.filter(s => s !== subject)
    );
  };
  
  // 3. 선택된 과목의 총 문제 수 계산
  const totalQuestionsForSelectedSubjects = useMemo(() => {
    if (selectedSubjects.length === 0 || rawExamInstances.length === 0) {
      return 0;
    }
    let count = 0;
    const selectedSubjectsSet = new Set(selectedSubjects); // 검색 성능 향상을 위해 Set 사용
    for (const instance of rawExamInstances) {
      if (selectedSubjectsSet.has(instance.subject)) {
        count += instance.questionCount;
      }
    }
    return count;
  }, [selectedSubjects, rawExamInstances]);
  
  if (loading) {
    return <div className="container mx-auto py-8 text-center">로딩 중...</div>;
  }
  if (error) {
    return <div className="container mx-auto py-8 text-center text-red-500">오류: {error}</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Breadcrumb items={breadcrumbItems} />
      <Tabs defaultValue="byDate" className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="byDate">시험 회차별 학습</TabsTrigger>
          <TabsTrigger value="bySubject">과목별 학습</TabsTrigger>
        </TabsList>
        <TabsContent value="byDate" className="mt-4">
          <ExamSessionListDisplay
            items={displayItemsByDate} // 이름 변경: displayItems -> displayItemsByDate
            title={decodedExamName ? `${decodedExamName} - 시험 회차별 문제 목록` : "시험 회차별 문제 목록"}
          />
        </TabsContent>
        <TabsContent value="bySubject" className="mt-4">
          <div className="p-4 border rounded-md bg-white shadow">
            <h2 className="text-lg font-semibold mb-4">과목 선택하여 학습하기</h2>
            {allSubjects.length > 0 ? (
              <div className="space-y-3">
                {allSubjects.map((subject) => (
                  <div key={subject} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50">
                    <Switch
                      id={`subject-switch-${subject}`}
                      checked={selectedSubjects.includes(subject)}
                      onCheckedChange={(checked) => handleSubjectSelection(subject, checked)}
                      aria-label={`과목 ${subject} 선택 스위치`}
                    />
                    <Label htmlFor={`subject-switch-${subject}`} className="flex-grow cursor-pointer text-sm">
                      {subject}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">선택할 수 있는 과목이 없거나 과목 정보를 불러오는 중입니다.</p>
            )}
            {/* 선택된 과목 임시 표시 및 학습 시작 버튼 */}
            {selectedSubjects.length > 0 && decodedExamName && (
              <div className="mt-6 p-3 bg-gray-100 rounded">
                <h3 className="text-md font-semibold mb-2">선택된 과목:</h3>
                <p className="text-sm text-gray-700 mb-4">{selectedSubjects.join(', ')}</p>
                {/* 4. 문제 수 표시 */}
                <p className="text-sm text-gray-600 mt-1 mb-3">총 문제 수: {totalQuestionsForSelectedSubjects}개</p>
                <Link 
                  href={`/learn/exams/${encodeURIComponent(decodedExamName)}/study?subjects=${encodeURIComponent(selectedSubjects.join(','))}`}
                  className="w-full block"
                >
                  <Button className="w-full">
                    선택한 과목으로 학습 시작
                  </Button>
                </Link>
              </div>
            )}
            {selectedSubjects.length === 0 && allSubjects.length > 0 && 
                 <p className="mt-6 text-sm text-center text-gray-500">학습할 과목을 선택해주세요.</p>
            }
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 