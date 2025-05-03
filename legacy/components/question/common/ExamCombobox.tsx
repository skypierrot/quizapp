'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react'; // 아이콘 추가
import { useToast } from '@/hooks/use-toast'; // useToast 임포트 추가

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator, // 구분선 추가
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { exams as ExamSchema } from '@/db/schema'; // Drizzle 스키마 타입 가져오기 (경로 확인 필요)
import { NewExamDialog } from './NewExamDialog'; // NewExamDialog 임포트

// exams 테이블의 타입 정의 (Drizzle 스키마에서 추론)
type Exam = typeof ExamSchema.$inferSelect;
type NewExamDetails = Omit<Exam, 'id' | 'createdAt' | 'updatedAt'>;

interface ExamComboboxProps {
  selectedExamId: string | null; // 선택된 시험 ID
  onExamSelect: (examId: string | null, newExamDetails?: NewExamDetails) => void; // 콜백 함수: 기존 선택 또는 새 정보 전달
  // TODO: 새 시험 정보 입력 UI를 위한 props 추가 (e.g., openDialog)
}

export function ExamCombobox({ selectedExamId, onExamSelect }: ExamComboboxProps) {
  const { toast } = useToast(); // toast 함수 초기화 추가
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isNewExamDialogOpen, setIsNewExamDialogOpen] = React.useState(false); // Dialog 상태 추가

  // TODO: Debounced API 호출 로직 추가
  React.useEffect(() => {
    const fetchExams = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/exams?q=${searchQuery}`);
        if (!response.ok) {
          throw new Error('Failed to fetch exams');
        }
        const data: Exam[] = await response.json();
        setExams(data);
      } catch (error) {
        console.error(error);
        // TODO: 사용자에게 에러 알림 (e.g., Toast)
        toast({ // toast 함수 사용 예시 (필요시 주석 해제)
          title: "오류",
          description: "시험 정보를 불러오는데 실패했습니다.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    // 검색어가 변경될 때 API 호출 (debounce 적용 필요)
    const timeoutId = setTimeout(() => {
        fetchExams();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);

  }, [searchQuery]);


  const handleSelect = (currentValue: string) => {
    const selected = exams.find(exam => exam.id === currentValue);
    if (selected) {
        onExamSelect(selected.id); // 기존 시험 선택 시 ID 전달
    }
    setOpen(false);
  };

  // "새 시험 정보 추가" CommandItem 클릭 시 Dialog 열기
  const handleAddNewExam = () => {
    setIsNewExamDialogOpen(true); // Dialog 열기
    setOpen(false); // Combobox Popover 닫기
  };

  // NewExamDialog에서 새 시험 정보를 받았을 때 처리
  const handleNewExamSubmit = async (newExamDetails: NewExamDetails) => {
    console.log("New exam details received in Combobox:", newExamDetails);
    // 서버에 새 시험 정보 생성 요청
    try {
      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newExamDetails),
      });

      if (!response.ok) {
        throw new Error('Failed to create exam');
      }

      const createdExam: Exam = await response.json(); // 생성된 시험 정보 받기

      // 콜백 호출: 새로 생성된 시험 ID 전달
      onExamSelect(createdExam.id);

      // 성공 토스트 메시지
      toast({
        title: "성공",
        description: "새 시험 정보가 성공적으로 추가되었습니다.",
      });

      // 시험 목록 갱신 (선택 사항)
      // fetchExams(); // 필요 시 목록 갱신

    } catch (error) {
      console.error("Error creating exam:", error);
      // 오류 토스트 메시지
      toast({
        title: "오류",
        description: "시험 정보 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 현재 선택된 시험 정보 찾기
  const selectedExam = exams.find(exam => exam.id === selectedExamId);
  const displayValue = selectedExam
    ? `${selectedExam.title} (${selectedExam.year}년 ${selectedExam.session}회)`
    : "시험 선택...";

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[300px] justify-between" // 너비 조정 필요
          >
            {displayValue}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput
              placeholder="시험 검색 (제목, 년도, 회차)"
              value={searchQuery}
              onValueChange={setSearchQuery} // 입력 시 searchQuery 상태 업데이트
            />
            <CommandList>
              {isLoading && <CommandItem>로딩 중...</CommandItem>}
              <CommandEmpty>시험 정보를 찾을 수 없습니다.</CommandEmpty>
              <CommandGroup>
                {exams.map((exam) => (
                  <CommandItem
                    key={exam.id}
                    value={exam.id} // value를 id로 설정
                    onSelect={handleSelect}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedExamId === exam.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {`${exam.title} (${exam.year}년 ${exam.session}회)`}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                  <CommandItem onSelect={handleAddNewExam} className="text-muted-foreground cursor-pointer">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      새 시험 정보 추가
                  </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* NewExamDialog 컴포넌트 렌더링 */}
      <NewExamDialog
        isOpen={isNewExamDialogOpen}
        onOpenChange={setIsNewExamDialogOpen}
        onExamSubmit={handleNewExamSubmit}
      />
    </div>
  );
} 