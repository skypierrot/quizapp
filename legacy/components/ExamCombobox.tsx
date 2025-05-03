'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Check, ChevronsUpDown, PlusCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { IExam } from '@/types'; // types/index.ts 또는 적절한 위치에서 가져옵니다.

interface IExamComboboxProps {
  value?: string; // 현재 선택된 examId
  onChange: (value: string) => void; // examId 변경 시 호출될 콜백
}

interface IExamFormData {
  title: string;
  year: string;
  subject: string;
  type: string;
  session: string;
}

export function ExamCombobox({ value, onChange }: IExamComboboxProps) {
  const [openCombobox, setOpenCombobox] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [exams, setExams] = useState<IExam[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExam, setSelectedExam] = useState<IExam | null>(null);
  const [newExamData, setNewExamData] = useState<IExamFormData>({
    title: '',
    year: '',
    subject: '',
    type: '',
    session: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // 시험 목록 가져오기
  const fetchExams = useCallback(async (query = '') => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/exams?search=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('시험 목록을 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      setExams(data.exams || []); // API 응답 형식에 따라 조정
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast({
        title: '오류',
        description: '시험 목록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
      setExams([]); // 오류 발생 시 빈 배열로 설정
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 및 초기 value 변경 시 시험 목록 로드 및 선택된 시험 설정
  useEffect(() => {
    fetchExams();
    if (value) {
      // value에 해당하는 시험 찾기 (초기 로드 시에는 exams가 비어있을 수 있음)
      const foundExam = exams.find(exam => exam.id === value);
      if (foundExam) {
        setSelectedExam(foundExam);
      } else if (exams.length > 0) {
          // exams 로드 후 다시 시도 (비효율적일 수 있음, API에서 ID로 조회하는게 더 좋음)
          const findAgain = async () => {
              // 이상적으로는 ID로 특정 시험을 조회하는 API 엔드포인트가 필요
              // 예: /api/exams/${value}
              // 여기서는 전체 목록에서 다시 찾는 방식으로 임시 구현
              const examById = exams.find(e => e.id === value);
              setSelectedExam(examById || null);
          }
          findAgain();
      }
    } else {
      setSelectedExam(null);
    }
  }, [value, fetchExams, exams]); // exams 의존성 추가

  const handleSelectExam = (exam: IExam) => {
    setSelectedExam(exam);
    onChange(exam.id);
    setOpenCombobox(false);
  };

  // 새 시험 생성 로직
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      // year와 session을 숫자로 변환
      const dataToSend = {
        ...newExamData,
        year: parseInt(newExamData.year, 10),
        session: parseInt(newExamData.session, 10),
      };

      // NaN 체크 (parseInt 실패 시)
      if (isNaN(dataToSend.year) || isNaN(dataToSend.session)) {
          throw new Error('년도와 회차는 숫자로 입력해야 합니다.');
      }

      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // 변환된 데이터 사용
        body: JSON.stringify(dataToSend), 
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '시험 생성에 실패했습니다.');
      }

      const createdExam: IExam = await response.json(); // API 응답에서 생성된 시험 정보 받기

      toast({
        title: '성공',
        description: '새로운 시험이 생성되었습니다.',
      });
      setExams(prev => [...prev, createdExam]); // 목록에 새 시험 추가
      handleSelectExam(createdExam); // 새로 생성된 시험 선택
      setOpenDialog(false); // 다이얼로그 닫기
      setNewExamData({ title: '', year: '', subject: '', type: '', session: '' }); // 폼 초기화
    } catch (error: any) {
      console.error('Error creating exam:', error);
      toast({
        title: '오류',
        description: error.message || '시험 생성 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewExamData(prev => ({ ...prev, [name]: value }));
  };

  // Combobox 입력 변경 시 서버 검색 트리거 (디바운스 적용하면 더 좋음)
  const handleCommandInputChange = (search: string) => {
    setSearchTerm(search);
    // 디바운스 없이 즉시 검색 요청
    fetchExams(search);
  };


  return (
    <div className="flex items-center space-x-2">
      <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={openCombobox}
            className="w-[250px] justify-between" // 너비 조정 가능
          >
            {selectedExam
              ? `${selectedExam.year}년 ${selectedExam.session}회차 ${selectedExam.title}`
              : '시험 선택...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0">
          <Command shouldFilter={false} /* 서버 측 검색 사용 */ >
            <CommandInput
              placeholder="시험 검색 (예: 정보처리기사 2023 1)"
              value={searchTerm}
              onValueChange={handleCommandInputChange} // 검색어 변경 시 핸들러
            />
            <CommandList>
                <CommandEmpty>{isLoading ? "검색 중..." : "결과 없음."}</CommandEmpty>
                <CommandGroup>
                {exams.map((exam) => (
                    <CommandItem
                    key={exam.id}
                    value={`${exam.year}년 ${exam.session}회차 ${exam.title}`} // 검색을 위한 값
                    onSelect={() => handleSelectExam(exam)}
                    >
                    <Check
                        className={cn(
                        'mr-2 h-4 w-4',
                        value === exam.id ? 'opacity-100' : 'opacity-0'
                        )}
                    />
                    {`${exam.year}년 ${exam.session}회차 ${exam.title}`}
                    </CommandItem>
                ))}
                </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" title="새 시험 만들기">
            <PlusCircle className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>새 시험 만들기</DialogTitle>
            <DialogDescription>
              새로운 시험 정보를 입력하세요. 년도, 과목명, 회차는 필수입니다.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateExam}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  과목명
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={newExamData.title}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                  placeholder="예: 정보처리기사 필기"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">
                  과목 상세
                </Label>
                <Input
                  id="subject"
                  name="subject"
                  value={newExamData.subject}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                  placeholder="예: 1과목 소프트웨어 설계"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  유형
                </Label>
                <Input
                  id="type"
                  name="type"
                  value={newExamData.type}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                  placeholder="예: 필기 / 실기"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="year" className="text-right">
                  년도
                </Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  value={newExamData.year}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                  placeholder="YYYY"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="session" className="text-right">
                  회차
                </Label>
                <Input
                  id="session"
                  name="session"
                  type="number"
                  value={newExamData.session}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                  placeholder="숫자"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? '생성 중...' : '시험 생성'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 