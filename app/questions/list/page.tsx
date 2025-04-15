"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IQuestion } from "@/types";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { ImageIcon, BookOpen, User, Calendar, ZoomIn, X } from "lucide-react";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

export default function QuestionsListPage() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [detailView, setDetailView] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [visibleTagsCount, setVisibleTagsCount] = useState<Record<string, number>>({});
  const tagContainersRef = useRef<Record<string, HTMLDivElement | null>>({});

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/questions?page=${page}&limit=10`);
      
      if (!response.ok) {
        throw new Error("문제 목록을 불러오는데 실패했습니다.");
      }
      
      const data = await response.json();
      setQuestions(data.questions);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("문제 로딩 오류:", error);
      toast({
        title: "문제 로딩 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // 이미지 줌 처리 함수
  const handleImageZoom = (imageUrl: string) => {
    setZoomedImage(imageUrl);
  };

  // 문제 삭제 함수
  const handleDelete = async (questionId: string) => {
    if (!confirm("정말로 이 문제를 삭제하시겠습니까?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error("문제 삭제에 실패했습니다.");
      }
      
      toast({
        title: "문제 삭제 성공",
        description: "문제가 성공적으로 삭제되었습니다.",
      });
      
      // 문제 목록 새로고침
      fetchQuestions();
    } catch (error) {
      console.error("문제 삭제 오류:", error);
      toast({
        title: "문제 삭제 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "error",
      });
    }
  };

  const handleViewDetail = (question: any) => {
    setSelectedQuestion(question);
  };

  const toggleDetailView = () => {
    setDetailView(!detailView);
  };

  useEffect(() => {
    fetchQuestions();
  }, [page]);

  // 이미지 렌더링 컴포넌트
  const QuestionImage = ({ image, index, label }: { image: string; index: number; label: string }) => (
    <div className="relative group cursor-zoom-in overflow-hidden rounded-md border border-gray-200 transition-all hover:shadow-md">
      <img 
        src={image} 
        alt={`${label} ${index+1}`} 
        className="w-auto max-w-full h-auto object-contain cursor-zoom-in min-h-[120px]"
        onClick={() => handleImageZoom(image)}
      />
      <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs py-1 px-2 rounded-full opacity-70 group-hover:opacity-100">
        <ZoomIn className="h-3 w-3 inline mr-1" />
        확대
      </div>
    </div>
  );

  const renderExplanationDialog = () => {
    if (!selectedQuestion) return null;

    return (
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>문제 해설</DialogTitle>
          <DialogDescription>
            문제에 대한 상세 정보와 해설을 확인하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {/* 1. 태그 */}
          {selectedQuestion.tags && selectedQuestion.tags.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-lg">태그</h3>
              <div className="flex flex-wrap gap-2">
                {selectedQuestion.tags.map((tag: string, idx: number) => (
                  <Badge key={idx}>{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* 2. 문제 */}
          <div>
            <h3 className="font-semibold mb-2 text-lg">문제</h3>
            <p className="whitespace-pre-wrap">{selectedQuestion.content}</p>
          </div>

          {/* 3. 문제 이미지 */}
          {selectedQuestion.images && selectedQuestion.images.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-lg">문제 이미지</h3>
              <div className="flex flex-col gap-4">
                {selectedQuestion.images.map((img: string, idx: number) => (
                  <QuestionImage 
                    key={idx} 
                    image={img} 
                    index={idx} 
                    label="문제 이미지" 
                  />
                ))}
              </div>
            </div>
          )}

          {/* 4. 선택지 */}
          {selectedQuestion.options && selectedQuestion.options.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-lg">선택지</h3>
              <div className="space-y-2">
                {selectedQuestion.options.map((option: any, idx: number) => (
                  <div key={idx} className={`p-3 rounded-md ${selectedQuestion.answer === idx ? 'bg-black text-white' : 'bg-gray-100'}`}>
                    {idx + 1}. {option.text || option}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. 해설 */}
          {selectedQuestion.explanation && (
            <div>
              <h3 className="font-semibold mb-2 text-lg">해설</h3>
              <p className="whitespace-pre-wrap">{selectedQuestion.explanation}</p>
            </div>
          )}

          {/* 6. 해설 이미지 */}
          {selectedQuestion.explanationImages && selectedQuestion.explanationImages.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-lg">해설 이미지</h3>
              <div className="flex flex-col gap-4">
                {selectedQuestion.explanationImages.map((img: string, idx: number) => (
                  <QuestionImage 
                    key={idx} 
                    image={img} 
                    index={idx} 
                    label="해설 이미지" 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    );
  };

  // 태그 컨테이너의 너비를 체크하고 표시할 태그 수를 계산하는 함수
  const calculateVisibleTags = () => {
    const newVisibleTagsCount: Record<string, number> = {};
    
    Object.entries(tagContainersRef.current).forEach(([questionId, container]) => {
      if (!container) return;
      
      const containerWidth = container.offsetWidth;
      const question = questions.find(q => q.id === questionId);
      if (!question || !question.tags) return;
      
      // 태그 평균 너비 (숫자로 더 정확한 계산이 필요하면 실제 태그 요소의 너비를 측정할 수 있음)
      const averageTagWidth = 80; // 하나의 태그에 대한 예상 너비 (px)
      const gap = 4; // 태그 사이의 간격 (px)
      
      // 컨테이너에 표시할 수 있는 태그 수 계산
      const maxVisibleTags = Math.floor(containerWidth / (averageTagWidth + gap));
      
      // 컨테이너에 모든 태그를 표시할 수 있는 경우
      if (maxVisibleTags >= question.tags.length) {
        newVisibleTagsCount[questionId] = question.tags.length;
      } else {
        // "+N" 배지를 고려하여 1개 이상의 태그는 표시
        newVisibleTagsCount[questionId] = Math.max(1, maxVisibleTags - 1);
      }
    });
    
    setVisibleTagsCount(newVisibleTagsCount);
  };

  // 창 크기가 변경되면 태그 수를 다시 계산
  useEffect(() => {
    calculateVisibleTags();
    
    const handleResize = () => {
      calculateVisibleTags();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [questions]);

  // 문제 카드 렌더링 함수
  const renderQuestionCard = (question: any, index: number) => (
    <Card key={question.id} className="h-full overflow-hidden flex flex-col">
      <CardHeader className="p-4 pb-2 space-y-2 bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="font-medium">#{(page - 1) * 10 + index + 1}</span>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <User className="h-3 w-3" />
              <span>{question.userId || "익명"}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>{new Date(question.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        {question.tags && question.tags.length > 0 && (
          <div 
            className="flex flex-wrap gap-1"
            ref={(el) => {
              tagContainersRef.current[question.id] = el;
              // 컴포넌트가 마운트된 후 태그 수 계산
              if (el && !visibleTagsCount[question.id]) {
                calculateVisibleTags();
              }
            }}
          >
            {visibleTagsCount[question.id] 
              ? (
                  <>
                    {question.tags.slice(0, visibleTagsCount[question.id]).map((tag: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {question.tags.length > visibleTagsCount[question.id] && (
                      <Badge variant="outline" className="text-xs">
                        +{question.tags.length - visibleTagsCount[question.id]}
                      </Badge>
                    )}
                  </>
                )
              : (
                  // 계산 중일 때는 처음 2개만 표시 (기존 동작)
                  <>
                    {question.tags.slice(0, 2).map((tag: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {question.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{question.tags.length - 2}
                      </Badge>
                    )}
                  </>
                )
            }
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-4 flex-grow">
        <div className="mb-3">
          <p className="font-medium line-clamp-3">
            {question.content}
          </p>
        </div>
        
        {detailView && (
          <div className="mt-4 space-y-4">
            {/* 문제 이미지 */}
            {question.images && question.images.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-2">문제 이미지</h4>
                <div className="flex flex-col gap-3">
                  {question.images.map((img: string, idx: number) => (
                    <QuestionImage 
                      key={idx} 
                      image={img} 
                      index={idx} 
                      label="문제 이미지" 
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* 선택지 */}
            {question.options && question.options.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-1">선택지</h4>
                <div className="space-y-1">
                  {question.options.map((option: any, idx: number) => (
                    <div key={idx} className={`p-2 rounded-md text-sm ${question.answer === idx ? 'bg-black text-white' : 'bg-gray-100'}`}>
                      {idx + 1}. {option.text || option}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 border-t mt-auto">
        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 w-full h-10 gap-1"
            onClick={() => handleViewDetail(question)}
          >
            <BookOpen className="h-4 w-4" />
            해설
          </Button>
          <Link href={`/questions/edit/${question.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="flex-1 w-full h-10">✏️ 수정</Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1 w-full h-10 hover:bg-gray-100 hover:text-gray-700"
            onClick={() => handleDelete(question.id)}
          >
            🗑️ 삭제
          </Button>
        </div>
      </CardFooter>
    </Card>
  );

  return (
    <div className="container py-8 px-4 sm:px-6 max-w-full md:max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">문제 목록</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant={detailView ? "default" : "outline"} 
            size="default"
            className="gap-1 h-10"
            onClick={toggleDetailView}
          >
            <ImageIcon className="h-4 w-4" />
            {detailView ? '상세보기' : '요약보기'}
          </Button>
          <Link href="/questions/new">
            <Button size="default" className="h-10">새 문제 등록</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">문제를 불러오는 중...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-8 border rounded-md">
          <p className="text-gray-500">등록된 문제가 없습니다.</p>
          <p className="mt-2">
            <Link href="/questions/new">
              <Button variant="link">새 문제 등록하기</Button>
            </Link>
          </p>
        </div>
      ) : (
        <>
          {/* 문제 카드 그리드 - 화면 크기에 따라 열 수 조정 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {questions.map((question, index) => renderQuestionCard(question, index))}
          </div>

          {/* 페이지네이션 */}
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="default"
              className="h-10"
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
            >
              이전
            </Button>
            
            <div className="flex items-center px-4 h-10 border rounded-md text-sm bg-gray-50">
              {page} / {totalPages}
            </div>
            
            <Button
              variant="outline"
              size="default"
              className="h-10"
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
            >
              다음
            </Button>
          </div>
        </>
      )}

      {/* 해설 다이얼로그 */}
      <Dialog open={!!selectedQuestion} onOpenChange={(open) => !open && setSelectedQuestion(null)}>
        {renderExplanationDialog()}
      </Dialog>

      {/* 이미지 확대 다이얼로그 */}
      <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto p-2">
          {/* 접근성을 위한 DialogTitle 추가 (시각적으로 숨김) */}
          <VisuallyHidden>
            <DialogTitle>확대 이미지</DialogTitle>
            <DialogDescription>선택한 이미지의 확대된 모습입니다.</DialogDescription>
          </VisuallyHidden>
          {zoomedImage && (
            <img src={zoomedImage} alt="Zoomed view" className="w-full h-auto object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 