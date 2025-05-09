export const runtime = "nodejs";

'use client';

import React, { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { IExam } from '@/types'; // IExam 타입 import (경로 확인 필요)

export default async function AdminExamsPage() {
  const { toast } = useToast();
  const [exams, setExams] = useState<IExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  
  // 시험 목록 데이터 페칭
  useEffect(() => {
    const fetchExams = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/exams');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '시험 목록을 불러오는데 실패했습니다.');
        }
        const data = await response.json();
        setExams(data.exams || []);
      } catch (err: any) {
        console.error("Error fetching exams:", err);
        setError(err.message || '데이터 로딩 중 오류가 발생했습니다.');
        setExams([]); // 오류 시 빈 배열로 설정
      } finally {
        setIsLoading(false);
      }
    };
    fetchExams();
  }, []);

  // 삭제 핸들러
  const handleDeleteExam = async (examId: string) => {
    setIsDeletingId(examId); // 삭제 시작 시 로딩 상태 설정
  
    try {
      const response = await fetch(`/api/exams/${examId}`, {
        method: 'DELETE',
      });
  
      if (!response.ok) {
        // API에서 반환된 오류 메시지 파싱 시도
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // JSON 파싱 실패 시 기본 오류 메시지 사용
          errorData = { error: `HTTP error! status: ${response.status}` };
        }
        throw new Error(errorData.error || '시험 정보 삭제에 실패했습니다.');
      }
  
      const result = await response.json(); // 성공 응답 (message, deletedId 포함)
  
      // 상태 업데이트: 목록에서 삭제된 시험 정보 제거
      setExams(prevExams => prevExams.filter(exam => exam.id !== examId));
  
      // 성공 토스트 표시
      toast({
        title: "삭제 성공",
        description: result.message || `시험 정보(ID: ${examId})가 삭제되었습니다.`,
        variant: "success",
      });
  
    } catch (error: any) {
      console.error("Error deleting exam:", error);
      // 오류 토스트 표시
      toast({
        title: "삭제 실패",
        description: error.message || "시험 정보를 삭제하는 중 오류가 발생했습니다.",
        variant: "error",
      });
    } finally {
      setIsDeletingId(null); // 로딩 상태 해제
    }
  };

  // 로딩 중 표시
  if (!isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2">데이터를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">시험 정보 관리 (관리자)</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded-md">
          <p>오류: {error}</p>
        </div>
      )}

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>시험명</TableHead>
              <TableHead>년도</TableHead>
              <TableHead>회차</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>생성일</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-10">
                  등록된 시험 정보가 없습니다.
                </TableCell>
              </TableRow>
            )}
            {exams.map((exam) => (
              <TableRow key={exam.id}>
                <TableCell>{exam.name}</TableCell>
                <TableCell>{exam.year}</TableCell>
                <TableCell>{exam.round}</TableCell>
                <TableCell className="text-xs text-gray-600">{exam.id}</TableCell>
                <TableCell>{exam.createdAt ? new Date(exam.createdAt).toLocaleDateString() : '-'}</TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={isDeletingId === exam.id}>
                        {isDeletingId === exam.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-1" />
                        )}
                        삭제
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                          '{exam.name} ({exam.year}년 {exam.round}회차)' 시험 정보를 삭제합니다. 이 작업은 되돌릴 수 없으며, 관련된 문제가 없을 경우에만 삭제됩니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeletingId === exam.id}>취소</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteExam(exam.id)} 
                          disabled={isDeletingId === exam.id}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeletingId === exam.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : null}
                          삭제 확인
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 