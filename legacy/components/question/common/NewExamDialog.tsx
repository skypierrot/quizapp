'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  // DialogTrigger, // Trigger는 ExamCombobox에서 관리
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { exams as ExamSchema } from '@/db/schema'; // 스키마 타입 임포트

// exams 테이블 타입 (id, createdAt, updatedAt 제외)
type NewExamDetails = Omit<typeof ExamSchema.$inferSelect, 'id' | 'createdAt' | 'updatedAt'>;

// Zod 스키마 정의 (API의 createExamSchema와 일치시키거나 여기서 별도 정의)
// API 스키마는 session이 number였으므로 여기도 number로 정의
const formSchema = z.object({
  title: z.string().min(1, { message: '제목을 입력해주세요.' }),
  year: z.coerce.number().int().min(1900, { message: '유효한 연도를 입력해주세요.' }), // coerce.number() 사용
  subject: z.string().min(1, { message: '과목을 입력해주세요.' }),
  type: z.string().min(1, { message: '유형을 입력해주세요.' }),
  session: z.coerce.number().int().min(1, { message: '회차는 1 이상의 숫자로 입력해주세요.' }), // coerce.number() 사용
});

interface NewExamDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onExamSubmit: (newExamDetails: NewExamDetails) => void;
}

export function NewExamDialog({ isOpen, onOpenChange, onExamSubmit }: NewExamDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      year: new Date().getFullYear(), // 기본값 현재 연도
      subject: '',
      type: '',
      session: 1, // 기본값 1회차
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log('New Exam Submitted:', values);
    onExamSubmit(values); // 부모 컴포넌트로 데이터 전달
    onOpenChange(false); // 다이얼로그 닫기
    form.reset(); // 폼 초기화
  }

  // Dialog가 닫힐 때 폼 상태 초기화
  const handleOpenChange = (open: boolean) => {
    if (!open) {
        form.reset();
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>새 시험 정보 추가</DialogTitle>
          <DialogDescription>
            등록하려는 문제의 시험 정보를 입력해주세요.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>제목</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 정보처리기사" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>년도</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="예: 2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>과목</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 필기" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>유형</FormLabel>
                  <FormControl>
                    <Input placeholder="예: CBT" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="session"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>회차</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="예: 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>취소</Button>
              <Button type="submit">저장</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 