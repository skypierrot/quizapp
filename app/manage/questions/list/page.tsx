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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageIcon, BookOpen, User, Calendar, PlusCircle, Search, XCircle } from "lucide-react";
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
    question.tags.forEach(tag => {
      if (!displayTags.some(dt => dt.endsWith(tag))) {
        displayTags.push(tag);
      }
    });
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
                      src={getImageUrl(img.url)}
                      alt={`문제 이미지 ${idx + 1}`}
                      className="block max-w-full h-auto object-contain mx-auto border rounded cursor-zoom-in"
                      containerClassName="max-w-[400px] max-h-[300px] flex items-center justify-center"
                      maintainAspectRatio={true}
                      onClick={() => onImageZoom(getImageUrl(img.url))}
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
                              src={getImageUrl(img.url)}
                              alt={`선택지 ${idx + 1} 이미지 ${imgIdx + 1}`}
                              className="block max-w-full h-auto object-contain mx-auto border rounded cursor-zoom-in"
                              containerClassName="max-w-[300px] max-h-[200px] flex items-center justify-center"
                              maintainAspectRatio={true}
                              onClick={() => onImageZoom(getImageUrl(img.url))}
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
                      src={getImageUrl(img.url)}
                      alt={`해설 이미지 ${idx + 1}`}
                      className="block max-w-full h-auto object-contain mx-auto border rounded cursor-zoom-in"
                      containerClassName="max-w-[400px] max-h-[300px] flex items-center justify-center"
                      maintainAspectRatio={true}
                      onClick={() => onImageZoom(getImageUrl(img.url))}
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
    question.tags.forEach(tag => {
      if (!displayTags.some(dt => dt.endsWith(tag))) {
        displayTags.push(tag);
      }
    });
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
                    src={getImageUrl(img.url)}
                    alt={`문제 이미지 ${idx + 1}`}
                    className="block max-w-full h-auto object-contain mx-auto border rounded cursor-zoom-in"
                    containerClassName="max-w-[400px] max-h-[300px] flex items-center justify-center"
                    maintainAspectRatio={true}
                    onClick={() => handleImageZoomInternal(getImageUrl(img.url))}
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
                          src={getImageUrl(img.url)}
                          alt={`선택지 ${idx + 1} 이미지 ${imgIdx + 1}`}
                          className="block max-w-full h-auto object-contain mx-auto border rounded cursor-zoom-in"
                          containerClassName="max-w-[300px] max-h-[200px] flex items-center justify-center"
                          maintainAspectRatio={true}
                          onClick={() => handleImageZoomInternal(getImageUrl(img.url))}
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
                      src={getImageUrl(img.url)}
                      alt={`해설 이미지 ${idx + 1}`}
                      className="block max-w-full h-auto object-contain mx-auto border rounded cursor-zoom-in"
                      containerClassName="max-w-[400px] max-h-[300px] flex items-center justify-center"
                      maintainAspectRatio={true}
                      onClick={() => handleImageZoomInternal(getImageUrl(img.url))}
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
      <DialogContent className="max-w-screen-lg w-auto p-0 bg-transparent border-none shadow-none">
        <VisuallyHidden>
          <DialogHeader>
            <DialogTitle>이미지 확대 보기</DialogTitle>
            <DialogDescription>확대된 이미지입니다. ESC 키를 누르거나 바깥 영역을 클릭하여 닫을 수 있습니다.</DialogDescription>
          </DialogHeader>
        </VisuallyHidden>
        <img src={imageUrl} alt="Zoomed content" className="max-w-full max-h-[90vh] object-contain rounded-lg" onClick={onClose} />
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

  const [examNameSearch, setExamNameSearch] = useState("");
  const [dateSearch, setDateSearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");

  const [showDuplicateCheckDialog, setShowDuplicateCheckDialog] = useState(false);
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<string[]>([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [isDeduplicating, setIsDeduplicating] = useState(false);

  const normalizeImages = useCallback((imgs: any): { url: string; hash?: string }[] => {
    if (Array.isArray(imgs)) {
      return imgs.map((img) =>
        typeof img === 'string' ? { url: img } : (img && typeof img.url === 'string' ? img : { url: '' })
      ).filter(img => img.url);
    }
    return [];
  }, []);

  const fetchQuestions = useCallback(async (currentPage = 1, searchParams?: { examName?: string; date?: string; subject?: string; tag?: string }) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });
      if (searchParams?.examName) query.append("examNameSearch", searchParams.examName);
      if (searchParams?.date) query.append("dateSearch", searchParams.date);
      if (searchParams?.subject) query.append("subjectSearch", searchParams.subject);
      if (searchParams?.tag) query.append("tagSearch", searchParams.tag);

      const response = await fetch(`/api/questions?${query.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "데이터 로딩 중 오류 발생" }));
        throw new Error(errorData.message || "Failed to fetch questions");
      }
      const data = await response.json();
      
      const normalizedQuestions = data.questions.map((q: any) => ({
        ...q,
        images: Array.isArray(q.images) ? q.images : (q.images ? [{ url: q.images, hash: '' }] : []),
        options: Array.isArray(q.options) ? q.options.map((opt: any) => ({
          ...opt,
          images: Array.isArray(opt.images) ? opt.images : (opt.images ? [{ url: opt.images, hash: '' }] : []),
        })) : [],
        explanationImages: Array.isArray(q.explanationImages) ? q.explanationImages : (q.explanationImages ? [{ url: q.explanationImages, hash: '' }] : []),
      }));
      setQuestions(normalizedQuestions);
      setTotalPages(data.totalPages || 0);
      setPage(data.page || 1);

    } catch (error: any) {
      toast({ title: "오류", description: error.message });
      setQuestions([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchQuestions(page);
  }, [page, fetchQuestions]);

  const handleSearch = () => {
    fetchQuestions(1, { 
      examName: examNameSearch, 
      date: dateSearch, 
      subject: subjectSearch,
      tag: tagSearch 
    });
  };

  const handleClearSearch = () => {
    setExamNameSearch("");
    setDateSearch("");
    setSubjectSearch("");
    setTagSearch("");
    fetchQuestions(1);
  };

  const handleDelete = async (questionId: string) => {
    if (!questionId) {
      toast({ title: "오류", description: "삭제할 문제 ID가 없습니다." });
      return;
    }
    if (confirm("정말로 이 문제를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      try {
        const response = await fetch(`/api/questions/${questionId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "문제 삭제 중 오류 발생" }));
          throw new Error(errorData.message || "Failed to delete question");
        }
        toast({ title: "성공", description: "문제가 성공적으로 삭제되었습니다." });
        fetchQuestions(page, { examName: examNameSearch, date: dateSearch, subject: subjectSearch, tag: tagSearch });
      } catch (error: any) {
        toast({ title: "오류", description: error.message });
      }
    }
  };

  const handleCheckDuplicates = async () => {
    setIsCheckingDuplicates(true);
    setDuplicateCheckResult([]);
    try {
      const response = await fetch('/api/questions/deduplicate');
      if (!response.ok) throw new Error('중복 검사 실패');
      const data = await response.json();
      
      // API 응답 구조에 맞게 수정: duplicates는 중복 그룹들의 배열
      if (data.duplicates && Array.isArray(data.duplicates)) {
        // 각 중복 그룹에서 첫 번째를 제외한 나머지 ID들을 추출
        const duplicateIds: string[] = [];
        data.duplicates.forEach((group: any[]) => {
          if (Array.isArray(group) && group.length > 1) {
            // 첫 번째를 제외한 나머지 ID들을 추가 (삭제 대상)
            for (let i = 1; i < group.length; i++) {
              if (group[i].id) {
                duplicateIds.push(group[i].id);
              }
            }
          }
        });
        setDuplicateCheckResult(duplicateIds);
      } else {
        setDuplicateCheckResult([]);
      }
      
      setShowDuplicateCheckDialog(true);
    } catch (error: any) {
      toast({ title: "중복 검사 오류", description: error.message });
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  const handleDeduplicate = async () => {
    if (duplicateCheckResult.length === 0) {
      toast({ title: "정보", description: "삭제할 중복 문제가 없습니다." });
      return;
    }
    setIsDeduplicating(true);
    try {
      const response = await fetch('/api/questions/deduplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "중복 제거 중 오류" }));
        throw new Error(errorData.message || '중복 문제 제거 실패');
      }
      const result = await response.json();
      toast({ title: "성공", description: `${result.deleted}개의 중복 문제가 제거되었습니다.` });
      setShowDuplicateCheckDialog(false);
      setDuplicateCheckResult([]);
      fetchQuestions(1);
    } catch (error: any) {
      toast({ title: "중복 제거 오류", description: error.message });
    } finally {
      setIsDeduplicating(false);
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
      
      {/* 검색 필터 영역 추가 */}
      <Card className="my-6">
        <CardHeader>
          <h2 className="text-xl font-semibold">검색 필터</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="examNameSearch">시험명</Label>
              <Input 
                id="examNameSearch"
                type="text" 
                placeholder="시험명 검색..." 
                value={examNameSearch} 
                onChange={(e) => setExamNameSearch(e.target.value)} 
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dateSearch">날짜</Label>
              <Input 
                id="dateSearch"
                type="text" 
                placeholder="날짜 검색 (YYYY or YYYY-MM)" 
                value={dateSearch} 
                onChange={(e) => setDateSearch(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="subjectSearch">과목</Label>
              <Input 
                id="subjectSearch"
                type="text" 
                placeholder="과목 검색..." 
                value={subjectSearch} 
                onChange={(e) => setSubjectSearch(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="tagSearch">일반 태그</Label>
              <Input 
                id="tagSearch"
                type="text" 
                placeholder="태그 검색 (쉼표로 구분 가능)" 
                value={tagSearch} 
                onChange={(e) => setTagSearch(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={handleClearSearch} variant="outline">
              <XCircle className="mr-2 h-4 w-4" />
              초기화
            </Button>
            <Button onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              검색
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">문제 목록</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleCheckDuplicates} disabled={isCheckingDuplicates} variant="outline">
            {isCheckingDuplicates ? '확인 중...' : '중복문제 확인'}
          </Button>
          {showDuplicateCheckDialog && duplicateCheckResult.length > 0 && (
            <Button onClick={handleDeduplicate} disabled={isDeduplicating} variant="destructive">
              {isDeduplicating ? '정리 중...' : '중복문제 정리'}
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

      {showDuplicateCheckDialog && duplicateCheckResult.length > 0 && (
        <div className="mb-8 p-4 border rounded-md bg-slate-50">
          <h2 className="text-lg font-semibold mb-3">삭제될 중복 문제들 ({duplicateCheckResult.length}개)</h2>
          <div className="space-y-6">
            {duplicateCheckResult.map((id, idx) => {
              const foundQuestion = questions.find(q => q.id === id);
              return (
                <div key={idx} className="border rounded p-4 bg-white text-sm">
                  <div className="text-xs text-gray-400 mb-1">ID: {id}</div>
                  {foundQuestion && (
                    <>
                      <div className="text-xs text-gray-500">정답: {typeof foundQuestion.answer === 'number' ? foundQuestion.answer + 1 : foundQuestion.answer}</div>
                      <div className="text-xs text-gray-500">태그: {(foundQuestion.tags || []).join(', ')}</div>
                      <div className="text-xs text-gray-500">등록일: {foundQuestion.createdAt ? new Date(foundQuestion.createdAt).toLocaleString() : ''}</div>
                    </>
                  )}
                  {!foundQuestion && <div className="text-xs text-red-500">문제 정보를 찾을 수 없습니다.</div>}
                </div>
              );
            })}
          </div>
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