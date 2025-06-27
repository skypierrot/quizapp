'use client';

import React, { useEffect, useState, useMemo } from 'react';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { IExamInstance } from '@/types';
import Breadcrumb from '@/components/common/Breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';

interface IExamInstancesResponse {
  examInstances: IExamInstance[];
}

interface IAggregatedExamDate {
  date: string;
  totalQuestionCount: number;
  subjects: string[];
  year?: string;
  subject?: string;
}

export default function LearnExamDateListPage() {
  const params = useParams();
  const router = useRouter();
  const [decodedExamName, setDecodedExamName] = useState<string | null>(null);
  const [aggregatedExamDates, setAggregatedExamDates] = useState<IAggregatedExamDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allSubjects, setAllSubjects] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [randomStart, setRandomStart] = useState<boolean>(true);
  const [rawExamInstances, setRawExamInstances] = useState<IExamInstance[]>([]);

  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [selectedDateInstanceData, setSelectedDateInstanceData] = useState<IAggregatedExamDate | null>(null);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isAllQuestions, setIsAllQuestions] = useState(false);
  const [questionLimit, setQuestionLimit] = useState<number | ''>(10);

  const examNameParam = params?.examName as string | undefined;

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
            const subjectsSet = new Set<string>();

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
              subjectsSet.add(instance.subject);
            }
            
            const aggregatedData = Object.values(groupedByDate).sort((a, b) => b.date.localeCompare(a.date));
            setAggregatedExamDates(aggregatedData);
            setAllSubjects(Array.from(subjectsSet).sort());

          } catch (err: any) {
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
      } catch (e: any) {
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

  const handleDateCardClick = (instance: IAggregatedExamDate) => {
    const specificInstance = rawExamInstances.find((raw: IExamInstance) => raw.date === instance.date);
    if (specificInstance) {
      setSelectedDateInstanceData({
        ...instance,
        year: specificInstance.year,
      });
    } else {
      setSelectedDateInstanceData({
        ...instance,
        year: instance.date.substring(0, 4),
      });
      console.warn(`No specific instance found in rawExamInstances for date: ${instance.date}. Falling back to derived year.`);
    }
    setIsDateModalOpen(true);
  };
  
  const handleDateStudyClick = () => {
    if (!selectedDateInstanceData || !decodedExamName || !selectedDateInstanceData.year) return;
    const subjectToUse = selectedDateInstanceData.subjects.length === 1 ? selectedDateInstanceData.subjects[0] : (selectedDateInstanceData.subjects.length > 0 ? selectedDateInstanceData.subjects[0] : 'default');

    const queryParams = new URLSearchParams({
      name: decodedExamName,
      year: selectedDateInstanceData.year,
      subject: subjectToUse,
      date: selectedDateInstanceData.date,
      ...(randomStart && { randomStart: 'true' }),
    }).toString();
    router.push(`/learn/exams/${encodeURIComponent(decodedExamName)}/study?${queryParams}`);
    setIsDateModalOpen(false);
  };

  const handleDateTestClick = () => {
    if (!selectedDateInstanceData || !decodedExamName || !selectedDateInstanceData.year) return;
    const subjectToUse = selectedDateInstanceData.subjects.length === 1 ? selectedDateInstanceData.subjects[0] : (selectedDateInstanceData.subjects.length > 0 ? selectedDateInstanceData.subjects[0] : 'default');

    const queryParams = new URLSearchParams({
      name: decodedExamName,
      year: selectedDateInstanceData.year,
      subject: subjectToUse,
      date: selectedDateInstanceData.date,
      ...(randomStart && { randomStart: 'true' }),
    }).toString();
    router.push(`/learn/exams/${encodeURIComponent(decodedExamName)}/test?${queryParams}`);
    setIsDateModalOpen(false);
  };

  const handleSubjectSelection = (subject: string, checked: boolean) => {
    setSelectedSubjects((prev: string[]) =>
      checked ? [...prev, subject] : prev.filter((s: string) => s !== subject)
    );
  };
  
  const totalQuestionsForSelectedSubjects = useMemo(() => {
    if (selectedSubjects.length === 0 || rawExamInstances.length === 0) {
      return 0;
    }
    let count = 0;
    const selectedSubjectsSet = new Set(selectedSubjects);
    for (const instance of rawExamInstances) {
      if (selectedSubjectsSet.has(instance.subject)) {
        count += instance.questionCount;
      }
    }
    return count;
  }, [selectedSubjects, rawExamInstances]);
  
  const handleOpenSubjectDialog = () => {
    if (selectedSubjects.length === 0 || !decodedExamName) {
      console.log("과목이 선택되지 않았거나 시험명이 없습니다.");
      return;
    }
    setIsSubjectModalOpen(true);
  };

  const handleSubjectStudyClick = () => {
    if (!decodedExamName || selectedSubjects.length === 0) return;
    const queryParams = new URLSearchParams({
      name: decodedExamName,
      subjects: selectedSubjects.join(','),
      ...(randomStart && { randomStart: 'true' }),
      ...(isAllQuestions ? {} : (questionLimit ? { limit: String(questionLimit) } : {})),
    }).toString();
    router.push(`/learn/exams/${encodeURIComponent(decodedExamName)}/study?${queryParams}`);
    setIsSubjectModalOpen(false);
  };

  const handleSubjectTestClick = () => {
    if (!decodedExamName || selectedSubjects.length === 0) return;
    const queryParams = new URLSearchParams({
      name: decodedExamName,
      subjects: selectedSubjects.join(','),
      ...(randomStart && { randomStart: 'true' }),
      ...(isAllQuestions ? {} : (questionLimit ? { limit: String(questionLimit) } : {})),
    }).toString();
    router.push(`/learn/exams/${encodeURIComponent(decodedExamName)}/test?${queryParams}`);
    setIsSubjectModalOpen(false);
  };

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
        <TabsContent value="byDate">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {aggregatedExamDates.length > 0 ? (
              aggregatedExamDates.map((instance: IAggregatedExamDate) => (
                <Card key={instance.date} onClick={() => handleDateCardClick(instance)} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>{instance.date}</CardTitle>
                    <CardDescription>
                      총 {instance.totalQuestionCount} 문제
                      <br />
                      과목: {instance.subjects.join(', ')}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))
            ) : (
              <p>선택하신 시험에 해당하는 회차가 없습니다.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="bySubject">
          <div className="mt-6">
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold">과목 선택</h3>
              {allSubjects.length > 0 ? (
                allSubjects.map((subject: string) => (
                  <div key={subject} className="flex items-center space-x-2">
                    <Switch
                      id={`subject-switch-${subject}`}
                      checked={selectedSubjects.includes(subject)}
                      onCheckedChange={(checked: boolean) => handleSubjectSelection(subject, checked)}
                    />
                    <Label htmlFor={`subject-switch-${subject}`}>{subject}</Label>
                  </div>
                ))
              ) : (
                <p>선택하신 시험에 해당하는 과목 정보가 없습니다. 먼저 시험 회차 정보를 확인해주세요.</p>
              )}
            </div>
            {selectedSubjects.length > 0 && (
              <div className="mb-4">
                <p>선택된 과목의 총 문제 수: {totalQuestionsForSelectedSubjects}</p>
              </div>
            )}
            <Button
              onClick={handleOpenSubjectDialog}
              disabled={selectedSubjects.length === 0 || totalQuestionsForSelectedSubjects === 0}
              className="w-full md:w-auto"
            >
              선택한 과목으로 학습/모의고사 시작
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDateModalOpen} onOpenChange={setIsDateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDateInstanceData?.date} 시험</DialogTitle>
            <DialogDescription>
              {selectedDateInstanceData?.subjects && selectedDateInstanceData.subjects.length > 0 && (
                <>과목: {selectedDateInstanceData.subjects.join(', ')}<br /></>
              )}
              어떤 작업을 수행하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 my-4">
            <Switch
              id="randomStartInDateDialog"
              checked={randomStart}
              onCheckedChange={setRandomStart}
            />
            <Label htmlFor="randomStartInDateDialog">문제 순서 랜덤으로 시작하기</Label>
          </div>
          <div className="flex flex-col sm:flex-row justify-around mt-4 space-y-2 sm:space-y-0 sm:space-x-2">
            <Button onClick={handleDateStudyClick} variant="outline" className="w-full">
              학습하기 (이론 및 문제 풀이)
            </Button>
            <Button onClick={handleDateTestClick} className="w-full">
              모의고사 (실전처럼 테스트)
            </Button>
          </div>
          <DialogFooter className="sm:justify-start mt-6">
            <DialogClose asChild>
              <Button type="button" variant="secondary" className="w-full sm:w-auto">
                닫기
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSubjectModalOpen} onOpenChange={setIsSubjectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>선택 과목 학습/모의고사</DialogTitle>
            <DialogDescription>
              선택한 과목: {selectedSubjects.join(', ')}
              <br />
              어떤 작업을 수행하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 my-4">
            <Switch
              id="randomStartInSubjectDialog"
              checked={randomStart}
              onCheckedChange={setRandomStart}
            />
            <Label htmlFor="randomStartInSubjectDialog">문제 순서 랜덤으로 시작하기</Label>
          </div>
          <div className="flex items-center space-x-2 my-4">
            <Switch
              id="allQuestionsSwitch"
              checked={isAllQuestions}
              onCheckedChange={setIsAllQuestions}
            />
            <Label htmlFor="allQuestionsSwitch">전체 문제 불러오기</Label>
            {!isAllQuestions && (
              <>
                <Input
                  id="questionLimitInput"
                  type="number"
                  min={1}
                  max={1000}
                  value={questionLimit}
                  onChange={e => setQuestionLimit(e.target.value === '' ? '' : Math.max(1, Math.min(1000, Number(e.target.value))))}
                  className="w-24"
                  placeholder="문제 수 입력"
                />
                <span className="text-xs text-gray-500">최대 1000문제</span>
              </>
            )}
          </div>
          <div className="flex flex-col sm:flex-row justify-around mt-4 space-y-2 sm:space-y-0 sm:space-x-2">
            <Button onClick={handleSubjectStudyClick} variant="outline" className="w-full">
              학습하기
            </Button>
            <Button onClick={handleSubjectTestClick} className="w-full">
              모의고사
            </Button>
          </div>
          <DialogFooter className="sm:justify-start mt-6">
            <DialogClose asChild>
              <Button type="button" variant="secondary" className="w-full sm:w-auto">
                닫기
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 