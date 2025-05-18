"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { ImageIcon, BookOpen, User, Calendar, PlusCircle } from "lucide-react";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import Breadcrumb from '@/components/common/Breadcrumb';
import { IQuestion, IOption } from "@/types";
import { CommonImage } from "@/components/common/CommonImage";
import { getImageUrl } from "@/utils/image";

// 문제 카드(요약/상세) 컴포넌트
function QuestionCard({
  question,
  index,
  page,
  onDetail,
  onEdit,
  onDelete,
  detailView,
  onImageZoom,
}: {
  question: IQuestion;
  index: number;
  page: number;
  onDetail: (q: IQuestion) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  detailView: boolean;
  onImageZoom: (url: string) => void;
}) {
  const displayTags: string[] = [];
  if (question.examName) displayTags.push(`시험명:${question.examName}`);
  if (question.examDate) displayTags.push(`날짜:${question.examDate}`);
  if (question.examSubject) displayTags.push(`과목:${question.examSubject}`);
  if (question.tags && question.tags.length > 0) {
    displayTags.push(...question.tags);
  }

  return (
    <Card className="h-full overflow-hidden flex flex-col">
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
              <span>{question.createdAt ? new Date(question.createdAt).toLocaleDateString() : ''}</span>
            </div>
          </div>
        </div>
        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {displayTags.map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="mb-3">
          <p className="font-medium line-clamp-3">
            {question.questionNumber !== null && question.questionNumber !== undefined ? `${question.questionNumber}. ` : ''}
            {question.content}
          </p>
        </div>
        {detailView && (
          <div className="mt-4 space-y-4">
            {question.images && question.images.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-2">문제 이미지</h4>
                <div className="flex flex-col gap-3">
                  {question.images.map((img, idx) => (
                    <CommonImage
                      key={idx}
                      src={getImageUrl(img)}
                      alt={`문제 이미지 ${idx + 1}`}
                      className="block max-w-full h-auto object-contain mx-auto border rounded cursor-zoom-in"
                      containerClassName="max-w-[400px] max-h-[300px] flex items-center justify-center"
                      maintainAspectRatio={true}
                      onClick={() => onImageZoom(getImageUrl(img))}
                    />
                  ))}
                </div>
              </div>
            )}
            {question.options && question.options.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-1">선택지</h4>
                <div className="space-y-1">
                  {question.options.map((option, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-md text-base transition-all duration-150
                        ${question.answer === idx
                          ? 'border-2 border-green-500 bg-green-50 font-semibold text-green-800'
                          : 'border border-gray-300 bg-gray-100 text-gray-700'
                        }
                      `}
                    >
                      {idx + 1}. {option.text}
                      {option.images && option.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {option.images.map((img, imgIdx) => (
                            <CommonImage
                              key={imgIdx}
                              src={getImageUrl(img)}
                              alt={`선택지 ${idx + 1} 이미지 ${imgIdx + 1}`}
                              className="block max-w-full h-auto object-contain mx-auto border rounded cursor-zoom-in"
                              containerClassName="max-w-[300px] max-h-[200px] flex items-center justify-center"
                              maintainAspectRatio={true}
                              onClick={() => onImageZoom(getImageUrl(img))}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {question.explanationImages && question.explanationImages.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-2">해설 이미지</h4>
                <div className="flex flex-col gap-3">
                  {question.explanationImages.map((img, idx) => (
                    <CommonImage
                      key={idx}
                      src={getImageUrl(img)}
                      alt={`해설 이미지 ${idx + 1}`}
                      className="block max-w-full h-auto object-contain mx-auto border rounded cursor-zoom-in"
                      containerClassName="max-w-[400px] max-h-[300px] flex items-center justify-center"
                      maintainAspectRatio={true}
                      onClick={() => onImageZoom(getImageUrl(img))}
                    />
                  ))}
                </div>
              </div>
            )}
            {question.explanation && (
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-2">해설</h4>
                <p className="whitespace-pre-wrap text-sm">{question.explanation}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 border-t mt-auto">
        <div className="flex gap-2 w-full">
          <Button variant="outline" size="sm" className="flex-1 w-full h-10 gap-1" onClick={() => onDetail(question)}>
            <BookOpen className="h-4 w-4" />
            해설보기
          </Button>
          <Link href={`/manage/questions/edit/${question.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full h-10">✏️ 수정</Button>
          </Link>
          {question.id && (
            <Button variant="outline" size="sm" className="flex-1 w-full h-10 text-gray-600 hover:bg-gray-100 hover:text-gray-700" onClick={() => onDelete(question.id!)}>
            🗑️ 삭제
          </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

// 해설(상세) 다이얼로그
function QuestionDetailDialog({ 
  open, 
  question, 
  onClose, 
  onImageZoom 
}: { 
  open: boolean; 
  question: IQuestion | null; 
  onClose: () => void; 
  onImageZoom?: (url: string) => void;
}) {
  if (!question) return null;

  const displayTags: string[] = [];
  if (question.examName) displayTags.push(`시험명:${question.examName}`);
  if (question.examDate) displayTags.push(`날짜:${question.examDate}`);
  if (question.examSubject) displayTags.push(`과목:${question.examSubject}`);
  if (question.tags && question.tags.length > 0) {
    displayTags.push(...question.tags);
  }
  
  const handleImageZoomInternal = onImageZoom || (() => {});

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>문제 상세</DialogTitle>
          <DialogDescription>선택한 문제의 상세 내용, 선택지, 해설을 보여줍니다.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {displayTags.map((tag, idx) => (
                <Badge key={idx} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-lg mb-2">문제 내용</h3>
            <p className="whitespace-pre-wrap">{question.content}</p>
            {question.images && question.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {question.images.map((img, idx) => (
                  <CommonImage
                    key={idx}
                    src={getImageUrl(img)}
                    alt={`문제 이미지 ${idx + 1}`}
                    className="block max-w-full h-auto object-contain mx-auto border rounded cursor-zoom-in"
                    containerClassName="max-w-[400px] max-h-[300px] flex items-center justify-center"
                    maintainAspectRatio={true}
                    onClick={() => handleImageZoomInternal(getImageUrl(img))}
                  />
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">선택지</h3>
            <div className="space-y-2">
              {question.options.map((opt, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-md text-base 
                    ${question.answer === idx
                      ? 'border-2 border-green-500 bg-green-50 font-semibold text-green-800'
                      : 'border border-gray-300 bg-gray-100 text-gray-700'}
                  `}
                >
                  {idx + 1}. {opt.text}
                  {opt.images && opt.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {opt.images.map((img, imgIdx) => (
                        <CommonImage
                          key={imgIdx}
                          src={getImageUrl(img)}
                          alt={`선택지 ${idx + 1} 이미지 ${imgIdx + 1}`}
                          className="block max-w-full h-auto object-contain mx-auto border rounded cursor-zoom-in"
                          containerClassName="max-w-[300px] max-h-[200px] flex items-center justify-center"
                          maintainAspectRatio={true}
                          onClick={() => handleImageZoomInternal(getImageUrl(img))}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {question.explanation && (
            <div>
              <h3 className="font-semibold text-lg mb-2">해설</h3>
              <p className="whitespace-pre-wrap">{question.explanation}</p>
              {question.explanationImages && question.explanationImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {question.explanationImages.map((img, idx) => (
                    <CommonImage
                      key={idx}
                      src={getImageUrl(img)}
                      alt={`해설 이미지 ${idx + 1}`}
                      className="block max-w-full h-auto object-contain mx-auto border rounded cursor-zoom-in"
                      containerClassName="max-w-[400px] max-h-[300px] flex items-center justify-center"
                      maintainAspectRatio={true}
                      onClick={() => handleImageZoomInternal(getImageUrl(img))}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ImageZoomModal({ imageUrl, onClose }: { imageUrl: string | null; onClose: () => void }) {
  if (!imageUrl) return null;
  return (
    <Dialog open={!!imageUrl} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] flex items-center justify-center p-0 bg-transparent border-0">
        <VisuallyHidden>
          <DialogTitle>이미지 확대</DialogTitle>
          <DialogDescription>클릭된 이미지를 크게 보여줍니다.</DialogDescription>
        </VisuallyHidden>
        <img src={imageUrl} alt="Zoomed image" className="max-w-full max-h-full object-contain" onClick={onClose} />
      </DialogContent>
    </Dialog>
  );
}

export default function QuestionsListPage() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<IQuestion | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const [detailView, setDetailView] = useState(false);
  const [showDuplicateCheck, setShowDuplicateCheck] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<any>(null);
  const [dedupLoading, setDedupLoading] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const normalizeImages = useCallback((imgs: any): { url: string; hash?: string }[] => {
    if (Array.isArray(imgs)) {
      return imgs.map((img) =>
        typeof img === 'string' ? { url: img } : (img && typeof img.url === 'string' ? img : { url: '' })
      ).filter(img => img.url);
    }
    return [];
  }, []);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("limit", "10");
      if (searchTerm) queryParams.append("searchTerm", searchTerm);
      if (filters.length > 0) queryParams.append("tags", filters.join(","));

      const response = await fetch(`/api/questions?${queryParams.toString()}`, { cache: 'no-store' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
        throw new Error(errorData.message || errorData.error || "Failed to fetch questions");
      }
      const data = await response.json();
      
      const processedQuestions = (data.questions || []).map((q: IQuestion) => ({
        ...q,
        images: normalizeImages(q.images),
        explanationImages: normalizeImages(q.explanationImages),
        options: (q.options || []).map((opt: IOption) => ({...opt, images: normalizeImages(opt.images)}))
      }));
      setQuestions(processedQuestions);

      const limitPerPage = parseInt(queryParams.get("limit") || "10");
      if (data.totalPages !== undefined) {
        setTotalPages(data.totalPages);
      } else if (data.totalQuestions !== undefined && limitPerPage > 0) {
        setTotalPages(Math.ceil(data.totalQuestions / limitPerPage));
      } else if (data.totalQuestions !== undefined && data.limit === 0) {
        setTotalPages(1);
      } else if (processedQuestions.length === 0 && data.totalQuestions === 0) {
        setTotalPages(0);
      } else {
        setTotalPages(1);
      }
    } catch (error) {
      toast({ title: "Error", description: (error instanceof Error ? error.message : "Failed to load questions.") });
      setQuestions([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, filters, toast, normalizeImages]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleDelete = async (questionId: string) => {
    if (!confirm("정말로 이 문제를 삭제하시겠습니까?")) return;
    try {
      const response = await fetch(`/api/questions/${questionId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete question");
      }
      toast({ title: "성공", description: "문제가 삭제되었습니다." });
      fetchQuestions();
    } catch (error) {
      toast({ title: "오류", description: (error instanceof Error ? error.message : "문제 삭제에 실패했습니다.") });
    }
  };

  const handleCheckDuplicates = async () => {
    setDedupLoading(true);
    setShowDuplicateCheck(false);
    try {
      const response = await fetch('/api/questions/deduplicate');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to check duplicates');
      }
      const result = await response.json();
      setDuplicateResult(result);
      setShowDuplicateCheck(true);
      if (!result.hasDuplicates && (!result.duplicates || result.duplicates.length === 0)) {
        toast({title: "중복 없음", description: "중복된 문제가 없습니다."}) 
      }
    } catch (error) {
      toast({ title: "Error", description: (error instanceof Error ? error.message : "Failed to check duplicates.") });
    } finally {
      setDedupLoading(false);
    }
  };

  const handleDeduplicate = async () => {
    if (!duplicateResult || (!duplicateResult.hasDuplicates && (!duplicateResult.duplicates || duplicateResult.duplicates.length === 0))) {
      toast({title: "정보", description: "삭제할 중복 항목이 없습니다."});
      return;
    }
    if (!confirm('중복 문제를 한 개만 남기고 모두 삭제하시겠습니까? (가장 최근에 수정된 문제만 남습니다)')) return;
    setDedupLoading(true);
    try {
      const response = await fetch('/api/questions/deduplicate', { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to remove duplicates');
      }
      const result = await response.json();
      toast({ title: "Success", description: result.message || "Duplicates removed." });
      setShowDuplicateCheck(false);
      setDuplicateResult(null);
      fetchQuestions();
    } catch (error) {
      toast({ title: "Error", description: (error instanceof Error ? error.message : "Failed to remove duplicates.") });
    } finally {
      setDedupLoading(false);
    }
  };
  
  const handleImageZoom = (url: string) => setZoomedImage(url);
  const closeImageZoom = () => setZoomedImage(null);

  const handleViewExplanation = (questionToView: IQuestion) => {
    setSelectedQuestion(questionToView);
  };

  const closeDetailDialog = () => {
    setSelectedQuestion(null);
  };

  const handleEditQuestion = (id: string) => {
    window.location.href = `/manage/questions/edit/${id}`;
  };

  const handlePrev = () => setPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setPage((p) => Math.min(p + 1, totalPages === 0 ? 1 : totalPages));

  const breadcrumbItems = [
    { label: "홈", href: "/" },
    { label: "문제 관리", href: "/manage/questions/list", isCurrent: true },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <Breadcrumb items={breadcrumbItems} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">문제 목록</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleCheckDuplicates} disabled={dedupLoading} variant="outline">
            {dedupLoading ? '확인 중...' : '중복문제 확인'}
          </Button>
          {showDuplicateCheck && duplicateResult && (duplicateResult.hasDuplicates || (duplicateResult.duplicates && duplicateResult.duplicates.length > 0)) && (
            <Button onClick={handleDeduplicate} disabled={dedupLoading} variant="destructive">
              {dedupLoading ? '정리 중...' : '중복문제 정리'}
            </Button>
          )}
          <Button 
            variant={detailView ? "secondary" : "outline"}
            onClick={() => setDetailView((v) => !v)}
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            {detailView ? "상세보기" : "요약보기"}
          </Button>
          <Link href="/manage/questions/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> 새 문제 등록
            </Button>
          </Link>
        </div>
      </div>

      {showDuplicateCheck && duplicateResult && (
        <div className="mb-8 p-4 border rounded-md bg-slate-50">
          <h2 className="text-lg font-semibold mb-3">중복 문제 그룹 ({duplicateResult.duplicates ? duplicateResult.duplicates.length : 0}건)</h2>
          {(!duplicateResult.duplicates || duplicateResult.duplicates.length === 0) ? (
            <div className="text-gray-500">중복된 문제가 없습니다.</div>
          ) : (
            <div className="space-y-6">
              {(duplicateResult.duplicates || []).map((group: any[], groupIdx: number) => (
                <div key={groupIdx} className="border rounded p-4 bg-gray-50 shadow">
                  <div className="mb-2 font-semibold text-blue-600">중복 그룹 #{groupIdx + 1} (총 {group.length}개)</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.map((q: any) => (
                      <div key={q.id} className="border rounded p-3 bg-white text-sm">
                        <div className="text-xs text-gray-400 mb-1">ID: {q.id}</div>
                        <div className="font-medium mb-1 line-clamp-2">{q.content}</div>
                        {q.examName && <div className="text-xs text-gray-500">시험명: {q.examName}</div>}
                        {q.examDate && <div className="text-xs text-gray-500">날짜: {q.examDate}</div>}
                        {q.examSubject && <div className="text-xs text-gray-500">과목: {q.examSubject}</div>}
                        <div className="text-xs text-gray-500 mb-1">정답: {typeof q.answer === 'number' ? q.answer + 1 : q.answer}</div>
                        <div className="text-xs text-gray-500 mb-1">태그: {(q.tags || []).join(', ')}</div>
                        <div className="text-xs text-gray-500">등록일: {q.createdAt ? new Date(q.createdAt).toLocaleString() : ''}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">문제를 불러오는 중...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-10 border rounded-md">
          <p className="text-gray-500 mb-2">등록된 문제가 없습니다.</p>
          <Link href="/manage/questions/new">
            <Button variant="default">
              <PlusCircle className="mr-2 h-4 w-4" /> 새 문제 등록하기
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {questions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={idx}
                page={page}
                onDetail={handleViewExplanation}
                onEdit={handleEditQuestion}
                onDelete={handleDelete}
                detailView={detailView}
                onImageZoom={handleImageZoom}
              />
            ))}
          </div>
          {totalPages > 0 && (
            <div className="flex justify-center items-center gap-3 mt-8">
              <Button variant="outline" onClick={handlePrev} disabled={page === 1}>
                이전
              </Button>
              <span className="text-sm text-gray-700">
                {page} / {totalPages}
              </span>
              <Button variant="outline" onClick={handleNext} disabled={page === totalPages || totalPages === 0}>
                다음
              </Button>
            </div>
          )}
        </>
      )}
      
      <QuestionDetailDialog 
        open={!!selectedQuestion} 
        question={selectedQuestion} 
        onClose={closeDetailDialog} 
        onImageZoom={handleImageZoom} 
      />
      <ImageZoomModal imageUrl={zoomedImage} onClose={closeImageZoom} />
    </div>
  );
}