'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { IExamResult } from '@/types';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, Trash2, Calendar, Award, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { formatKoreanDateTime } from "@/utils/time";

export default function ExamResultsPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [results, setResults] = useState<IExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resultToDelete, setResultToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      loadResults();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status]);

  const loadResults = () => {
    setLoading(true);
    fetch('/api/exam-results', { credentials: 'include' })
      .then(res => {
        if (!res.ok) {
          if (res.status === 401) {
            toast({
              title: "인증 오류",
              description: "로그인이 필요합니다.",
              variant: "destructive"
            });
            throw new Error('인증되지 않은 사용자입니다');
          }
          throw new Error('서버 오류가 발생했습니다');
        }
        return res.json();
      })
      .then(data => {
        // 응답이 배열인지 확인
        const resultsArray = Array.isArray(data) ? data : data.results || [];
        setResults(resultsArray);
      })
      .catch(error => {
        console.error('결과 로드 오류:', error);
        setResults([]);
      })
      .finally(() => setLoading(false));
  };

  const handleDeleteClick = (resultId: string) => {
    setResultToDelete(resultId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!resultToDelete) return;
    
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/exam-results/${resultToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('삭제 중 오류가 발생했습니다.');
      }
      
      // 삭제 성공 시 결과 목록에서 제거
      setResults(prev => prev.filter(r => r.id !== resultToDelete));
      toast({
        title: "삭제 완료",
        description: "시험 결과가 성공적으로 삭제되었습니다."
      });
    } catch (error) {
      console.error('삭제 오류:', error);
      toast({
        title: "삭제 실패",
        description: "시험 결과를 삭제하는 중 오류가 발생했습니다."
      });
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setResultToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  // 결과가 없을 때 표시할 내용
  const NoResults = () => (
    <div className="text-center py-10 border rounded-lg bg-gray-50">
      <p className="text-gray-400">아직 응시한 시험 결과가 없습니다.</p>
      <p className="text-gray-400">응시 내역을 확인하시려면 로그인하세요.</p>
    </div>
  );

  return (
    <div className="w-full md:w-11/12 lg:w-5/6 mx-auto py-4 md:py-8 px-4 md:px-0">
      <h2 className="text-xl font-bold mb-2">나의 시험 결과</h2>
      <p className="mb-4 text-gray-500 text-sm">지금까지 응시한 모든 시험 결과 목록입니다.</p>
      
      {results.length === 0 ? (
        <NoResults />
      ) : (
        <>
          {/* 모바일에서 카드 형식으로 표시 */}
          <div className="md:hidden space-y-4">
            {results.map(result => (
              <Card key={`mobile-${result.id || 'unknown'}`} className="w-full border shadow-sm">
                <CardContent className="p-4">
                  <div className="font-bold text-lg">{result.examName}</div>
                  <div className="text-xs text-gray-500 mb-3">
                    {result.examDate ? result.examDate : String(result.examYear)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">{formatKoreanDateTime(result.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">{Math.floor(result.elapsedTime / 60)}분 {result.elapsedTime % 60}초</span>
                    </div>
                  </div>
                  
                  <div className="my-3 flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-500" />
                    <span className={`font-bold text-lg ${result.score < 60 ? 'text-red-600' : 'text-blue-600'}`}>
                      {result.score}점 
                      <span className="text-sm font-normal text-gray-500 ml-1">
                        ({result.correctCount}/{result.totalQuestions})
                      </span>
                    </span>
                  </div>
                  
                  {/* 과목별 점수 */}
                  {result.subjectStats && Object.keys(result.subjectStats).length > 0 && (
                    <div className="mt-3 mb-4 border-t pt-2">
                      <div className="text-sm font-medium mb-1">과목별 점수</div>
                      <div className="grid grid-cols-1 gap-1">
                        {Object.entries(result.subjectStats).map(([subject, stats]) => {
                          const subjectScore = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                          const isFailScore = subjectScore < 60;
                          return (
                            <div key={`mobile-${result.id || 'unknown'}-${subject}`} className="flex justify-between items-center">
                              <span className="text-sm">{subject}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                isFailScore ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {subjectScore}점
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-2">
                    <Button asChild size="sm" variant="outline" className="h-8 px-3 text-xs">
                      <Link href={`/results/${result.id || ''}`}>
                        <ExternalLink className="h-3 w-3 mr-1" /> 상세 보기
                      </Link>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 px-3 text-xs border-gray-300 hover:bg-gray-50 hover:text-gray-800"
                      onClick={() => result.id && handleDeleteClick(result.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1 text-gray-700" /> 삭제
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 데스크탑에서 테이블 형식으로 표시 */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full mx-auto table-auto border-t text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="py-3 px-2 text-center align-middle">응시일</th>
                  <th className="py-3 px-2 text-center align-middle">시험명</th>
                  <th className="py-3 px-2 text-center align-middle">점수(정답/총문항)</th>
                  <th className="py-3 px-2 text-center align-middle">과목별 점수</th>
                  <th className="py-3 px-2 text-center align-middle">소요시간</th>
                  <th className="py-3 px-2 text-center align-middle">상세</th>
                  <th className="py-3 px-2 text-center align-middle">삭제</th>
                </tr>
              </thead>
              <tbody>
                {results.map(result => (
                  <tr key={`desktop-${result.id || 'unknown'}`} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 align-middle text-center">{formatKoreanDateTime(result.createdAt)}</td>
                    <td className="py-2 px-2 align-middle text-center">
                      <div className="font-semibold">{result.examName}</div>
                      <div className="text-xs text-gray-500">
                        {result.examDate ? result.examDate : String(result.examYear)}
                      </div>
                    </td>
                    <td className="py-2 px-2 align-middle text-center">
                      <span className={`font-bold ${result.score < 60 ? 'text-red-600' : 'text-blue-600'}`}>{result.score}점</span>
                      <div className="text-xs text-gray-500">({result.correctCount}/{result.totalQuestions})</div>
                    </td>
                    <td className="py-2 px-2 align-middle text-center">
                      {result.subjectStats && Object.keys(result.subjectStats).length > 0 ? (
                        <div className="flex flex-col items-center gap-1.5">
                          {Object.entries(result.subjectStats).map(([subject, stats]) => {
                            const subjectScore = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                            const isFailScore = subjectScore < 60;
                            return (
                              <div key={`desktop-${result.id || 'unknown'}-${subject}`} className="flex items-center justify-between gap-2 w-full">
                                <span className="text-xs text-left">{subject}</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                  isFailScore ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                  {subjectScore}점
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-2 px-2 align-middle text-center">
                      {Math.floor(result.elapsedTime / 60)}분 {result.elapsedTime % 60}초
                    </td>
                    <td className="py-2 px-2 align-middle text-center">
                      <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                        <Link href={`/results/${result.id || ''}`}>
                          <ExternalLink className="inline h-3 w-3 mr-1" /> 보기
                        </Link>
                      </Button>
                    </td>
                    <td className="py-2 px-2 align-middle text-center">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 px-2 text-xs border-gray-300 hover:bg-gray-50 hover:text-gray-800"
                        onClick={() => result.id && handleDeleteClick(result.id)}
                      >
                        <Trash2 className="inline h-3 w-3 mr-1 text-gray-700" /> 삭제
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>시험 결과 삭제</DialogTitle>
            <DialogDescription>
              선택한 시험 결과를 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteLoading}
            >
              취소
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
            >
              {deleteLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />} 
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
