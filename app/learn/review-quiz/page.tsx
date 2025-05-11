"use client";
import useSWR from "swr";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CommonImage } from "@/components/common/CommonImage";
import { useImageZoom } from "@/hooks/useImageZoom";
import { ImageZoomModal } from "@/components/common/ImageZoomModal";
import { getImageUrl } from "@/utils/image";
import { useSWRConfig } from 'swr';

// 내부 개발 서버 기준 BASE_URL
const BASE_URL = "https://quizapp-dev";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const periodList = [
  { value: "", label: "전체" },
  { value: "1m", label: "최근 1개월" },
  { value: "3m", label: "최근 3개월" },
  { value: "6m", label: "최근 6개월" },
];
const sortList = [
  { value: "wrongCount", label: "누적 오답순" },
  { value: "recent", label: "최신 오답순" },
];
const limitList = [
  { value: 10, label: "10개" },
  { value: 20, label: "20개" },
  { value: 50, label: "50개" },
];

function getSinceDate(period: string) {
  if (!period) return "";
  const now = new Date();
  if (period === "1m") now.setMonth(now.getMonth() - 1);
  if (period === "3m") now.setMonth(now.getMonth() - 3);
  if (period === "6m") now.setMonth(now.getMonth() - 6);
  return now.toISOString().slice(0, 10);
}

// 반응형 훅: useMediaQuery (간단 구현)
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  return matches;
}

// 문제별 retry 상태 관리
function getInitialRetryState(questions: any[]) {
  const state: Record<string, { isRetry: boolean; retryAnswer: number|null; showResult: boolean }> = {};
  questions.forEach(q => {
    state[q.questionId] = { isRetry: false, retryAnswer: null, showResult: false };
  });
  return state;
}

function safeNumberDisplay(value: any, fallback: string = '-') {
  return typeof value === 'number' && !isNaN(value) ? value + 1 : fallback;
}

export default function WrongNoteReviewQuizPage() {
  const { mutate } = useSWRConfig();
  const [examType, setExamType] = useState("");
  const [tag, setTag] = useState("");
  const [activeTab, setActiveTab] = useState<'wrongCount'|'recent'>("wrongCount");
  const isMobile = useMediaQuery("(max-width: 768px)");

  const { data: wrongCountData, isLoading: loading1, error: error1 } = useSWR(`/api/wrong-note/review?sort=wrongCount&examType=${examType}&tag=${tag}`, fetcher);
  const { data: recentData, isLoading: loading2, error: error2 } = useSWR(`/api/wrong-note/review?sort=recent&examType=${examType}&tag=${tag}`, fetcher);
  const imageZoom = useImageZoom();

  // 문제별 retry 상태
  const [retryState, setRetryState] = useState<Record<string, { isRetry: boolean; retryAnswer: number|null; showResult: boolean }>>({});
  // 문제별 정답보기 상태
  const [showAnswerMap, setShowAnswerMap] = useState<Record<string, boolean>>({});
  const [singleView, setSingleView] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  // 문제별 메모 상태 관리
  const [memoMap, setMemoMap] = useState<Record<string, string>>({});
  const [editMemoMap, setEditMemoMap] = useState<Record<string, string>>({});
  const [editModeMap, setEditModeMap] = useState<Record<string, boolean>>({});

  // 메모 핸들러
  const handleEditMemo = (questionId: string) => {
    setEditModeMap(prev => ({ ...prev, [questionId]: true }));
    setEditMemoMap(prev => ({ ...prev, [questionId]: memoMap[questionId] || '' }));
  };
  const handleChangeEditMemo = (questionId: string, value: string) => {
    setEditMemoMap(prev => ({ ...prev, [questionId]: value }));
  };
  const handleSaveMemo = async (questionId: string, memoValue: string) => {
    const memo = memoValue || '';
    try {
      await fetch('/api/wrong-note/memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, memo }),
      });
      setEditModeMap(prev => ({ ...prev, [questionId]: false }));
      mutate(`/api/wrong-note/review?sort=wrongCount&examType=${examType}&tag=${tag}`);
      mutate(`/api/wrong-note/review?sort=recent&examType=${examType}&tag=${tag}`);
    } catch (e) {
      alert('메모 저장에 실패했습니다.');
    }
  };
  const handleCancelEditMemo = (questionId: string) => {
    setEditModeMap(prev => ({ ...prev, [questionId]: false }));
  };
  const handleDeleteMemo = async (questionId: string) => {
    try {
      await fetch(`/api/wrong-note/memo?questionId=${questionId}`, { method: 'DELETE' });
      setEditModeMap(prev => ({ ...prev, [questionId]: false }));
      mutate(`/api/wrong-note/review?sort=wrongCount&examType=${examType}&tag=${tag}`);
      mutate(`/api/wrong-note/review?sort=recent&examType=${examType}&tag=${tag}`);
    } catch (e) {
      alert('메모 삭제에 실패했습니다.');
    }
  };

  // 문제 데이터가 바뀔 때 retryState 초기화
  useEffect(() => {
    const questions = (activeTab === 'wrongCount' ? wrongCountData?.review : recentData?.review) || [];
    setRetryState(getInitialRetryState(questions));
  }, [wrongCountData, recentData, activeTab]);

  // 오답노트 데이터가 바뀔 때 memoMap을 API 응답의 memo로 초기화
  useEffect(() => {
    const questions = (activeTab === 'wrongCount' ? wrongCountData?.review : recentData?.review) || [];
    const newMemoMap: Record<string, string> = {};
    questions.forEach((q: any) => {
      newMemoMap[q.questionId] = q.memo || '';
    });
    setMemoMap(newMemoMap);
  }, [wrongCountData, recentData, activeTab]);

  // 동적 필터 옵션 집계
  const [examTypeList, setExamTypeList] = useState<{ value: string, label: string }[]>([{ value: '', label: '전체' }]);
  const [tagList, setTagList] = useState<{ value: string, label: string }[]>([{ value: '', label: '전체 태그' }]);
  useEffect(() => {
    // 모든 문제 데이터에서 시험명/태그 집계
    const allQuestions = [
      ...(wrongCountData?.review || []),
      ...(recentData?.review || [])
    ];
    const examNames = Array.from(new Set(allQuestions.map(q => q.examName).filter(Boolean)));
    setExamTypeList([{ value: '', label: '전체' }, ...examNames.map(n => ({ value: n, label: n }))]);
    // 태그 집계(문제별 tags 배열이 있다고 가정, 없으면 무시)
    const tagSet = new Set<string>();
    allQuestions.forEach(q => {
      if (Array.isArray(q.tags)) q.tags.forEach((t: string) => tagSet.add(t));
    });
    setTagList([{ value: '', label: '전체 태그' }, ...Array.from(tagSet).map(t => ({ value: t, label: t }))]);
  }, [wrongCountData, recentData]);

  // 필터 바
  const FilterBar = (
    <div className="flex gap-2 mb-4">
      <select value={examType} onChange={e => setExamType(e.target.value)}>{examTypeList.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select>
      <select value={tag} onChange={e => setTag(e.target.value)}>{tagList.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select>
    </div>
  );

  // 문제 카드 컴포넌트
  function WrongNoteCard({ q, idx, showAnswer, onShowAnswer }: {
    q: any,
    idx: number,
    showAnswer: boolean,
    onShowAnswer: (show: boolean) => void
  }) {
    const state = retryState[q.questionId] || { isRetry: false, retryAnswer: null, showResult: false };
    const handleRetry = () => setRetryState(prev => ({ ...prev, [q.questionId]: { isRetry: true, retryAnswer: null, showResult: false } }));
    const handleSelect = (i: number) => {
      if (!state.isRetry || state.showResult) return;
      setRetryState(prev => ({ ...prev, [q.questionId]: { ...prev[q.questionId], retryAnswer: i } }));
    };
    const handleSubmit = () => setRetryState(prev => ({ ...prev, [q.questionId]: { ...prev[q.questionId], showResult: true } }));
    const isRetryMode = state.isRetry;
    const retryAnswer = state.retryAnswer;
    const showResult = state.showResult;
    const correctIdx = Number(q.correctAnswer);
    const userAnswerIdx = q.userAnswer !== undefined && q.userAnswer !== null ? Number(q.userAnswer) : null;
    // 실제 답(오답노트 기준)과 다시풀기 답 구분
    // 메모 관련 상태
    const memo = memoMap[q.questionId] || '';
    const editMemo = editMemoMap[q.questionId] || '';
    const editMode = editModeMap[q.questionId] || false;
    const onEditMemo = () => editMode ? handleCancelEditMemo(q.questionId) : handleEditMemo(q.questionId);
    const onChangeEditMemo = (value: string) => handleChangeEditMemo(q.questionId, value);
    const onSaveMemo = (value: string) => handleSaveMemo(q.questionId, value);
    const onDeleteMemo = () => handleDeleteMemo(q.questionId);

    // IME 한글 입력 문제 해결: textarea는 카드 내부의 로컬 상태로만 관리
    const [localEditMemo, setLocalEditMemo] = useState(editMemo);
    useEffect(() => {
      if (editMode) setLocalEditMemo(editMemo);
    }, [editMode, editMemo]);

    return (
      <div className="p-4 border rounded bg-white mb-4">
        <div className="font-bold mb-2">Q{idx+1}. <span dangerouslySetInnerHTML={{__html: q.question}} /></div>
        {q.images && q.images.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {q.images.map((img: any, i: number) => (
              <CommonImage key={i} src={getImageUrl(img)} alt={`문제이미지${i+1}`} className="rounded border max-w-[120px] max-h-[120px]" maintainAspectRatio onClick={() => imageZoom.showZoom(getImageUrl(img))} />
            ))}
          </div>
        )}
        <div className="space-y-2 mb-2">
          {q.options && q.options.map((opt: any, i: number) => {
            // 다시풀기 모드
            if (isRetryMode) {
              const isSelected = retryAnswer === i;
              const isCorrectAnswer = correctIdx !== null && correctIdx !== -1 && correctIdx === i;
              const isUserAnswer = retryAnswer === i;
              return (
                <div
                  key={i}
                  className={`flex flex-col space-y-1 p-2 rounded cursor-pointer border ${isSelected ? 'bg-blue-100 border-blue-400' : 'hover:bg-gray-50 border-gray-200'} ${showResult && isCorrectAnswer ? 'bg-green-100 border-green-400' : ''}`}
                  onClick={() => handleSelect(i)}
                >
                  <div className="flex items-center flex-wrap">
                    <span className="font-semibold mr-2">{safeNumberDisplay(i)}</span>
                    <span className="flex-1 mr-2">{opt.text}</span>
                    {showResult && isUserAnswer && (
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap ${isCorrectAnswer ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>나의 답</span>
                    )}
                    {showResult && isCorrectAnswer && !isUserAnswer && (
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 whitespace-nowrap">(정답)</span>
                    )}
                  </div>
                  {opt.images && opt.images.length > 0 && (
                    <div className="ml-6 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {opt.images.map((img: any, j: number) => (
                        <CommonImage key={j} src={getImageUrl(img)} alt={`선택지이미지${i+1}-${j+1}`} className="rounded border max-w-[60px] max-h-[60px]" maintainAspectRatio onClick={() => imageZoom.showZoom(getImageUrl(img))} />
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            // 일반 오답노트 모드(모의고사 결과 상세와 동일하게)
            const isUserAnswer = userAnswerIdx !== null && userAnswerIdx !== -1 && userAnswerIdx === i;
            const isCorrectAnswer = showAnswer && correctIdx !== null && correctIdx !== -1 && correctIdx === i;
            return (
              <div
                key={i}
                className={`flex flex-col space-y-1 p-2 rounded border ${isUserAnswer && (!isCorrectAnswer) ? 'bg-red-50 border-red-200 ring-1 ring-red-200' : ''} ${isCorrectAnswer ? 'bg-green-50 border-green-200 ring-1 ring-green-200' : ''} ${!isUserAnswer && !isCorrectAnswer ? 'border-gray-200' : ''}`}
              >
                <div className="flex items-center flex-wrap">
                  <span className="font-semibold mr-2">{safeNumberDisplay(i)}</span>
                  <span className="flex-1 mr-2">{opt.text}</span>
                  {isUserAnswer && (
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap ${isCorrectAnswer ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>나의 답</span>
                  )}
                  {showAnswer && isCorrectAnswer && !isUserAnswer && (
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 whitespace-nowrap">(정답)</span>
                  )}
                </div>
                {opt.images && opt.images.length > 0 && (
                  <div className="ml-6 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {opt.images.map((img: any, j: number) => (
                      <CommonImage key={j} src={getImageUrl(img)} alt={`선택지이미지${i+1}-${j+1}`} className="rounded border max-w-[60px] max-h-[60px]" maintainAspectRatio onClick={() => imageZoom.showZoom(getImageUrl(img))} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {/* 답변 미선택 경고 */}
          {userAnswerIdx === null || userAnswerIdx === -1 ? (
            <p className="text-sm text-muted-foreground mt-2">⚠️ 답변을 선택하지 않았습니다.</p>
          ) : null}
        </div>
        {/* 다시풀기 버튼/제출 버튼 및 정답보기 버튼 */}
        {!isRetryMode ? (
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={handleRetry}>다시 풀어보기</Button>
            {showAnswer ? (
              <Button variant="secondary" onClick={() => onShowAnswer(false)}>정답가리기</Button>
            ) : (
              <Button variant="secondary" onClick={() => onShowAnswer(true)}>정답보기</Button>
            )}
          </div>
        ) : !showResult ? (
          <Button className="mt-2" disabled={retryAnswer === null} onClick={handleSubmit}>제출</Button>
        ) : null}
        {/* 해설/해설이미지: 다시풀기 모드가 아니거나, showResult일 때만 표시 */}
        {(!isRetryMode || showResult) && (
          <>
            <div className="text-gray-600 mb-1">해설: {q.explanation}</div>
            {q.explanationImages && q.explanationImages.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {q.explanationImages.map((img: any, i: number) => (
                  <CommonImage key={i} src={getImageUrl(img)} alt={`해설이미지${i+1}`} className="rounded border max-w-[120px] max-h-[120px]" maintainAspectRatio onClick={() => imageZoom.showZoom(getImageUrl(img))} />
                ))}
              </div>
            )}
          </>
        )}
        <div className="mt-4">
          {editMode ? (
            <>
              <textarea
                value={localEditMemo}
                onChange={e => setLocalEditMemo(e.target.value)}
                className="w-full border rounded p-2 text-sm"
                rows={2}
                placeholder="이 문제에 대한 나만의 메모를 남겨보세요!"
              />
              <div className="flex gap-2 mt-1">
                <Button size="sm" onClick={() => handleSaveMemo(q.questionId, localEditMemo)}>저장</Button>
                <Button size="sm" variant="outline" onClick={onEditMemo}>취소</Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm min-h-[2em]">{memo || <span className="text-gray-400">메모 없음</span>}</div>
              <div className="flex gap-2 mt-1">
                <Button size="sm" variant="outline" onClick={onEditMemo}>수정</Button>
                {memo && (
                  <Button size="sm" variant="destructive" onClick={onDeleteMemo}>삭제</Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // 문제 리스트 카드
  function WrongNoteList({ data }: { data: any[] }) {
    if (!data || data.length === 0) return <div>문제가 없습니다.</div>;
    return (
      <div className="space-y-4">
        {data.map((q: any, idx: number) => (
          <WrongNoteCard
            key={q.questionId}
            q={q}
            idx={idx}
            showAnswer={showAnswerMap[q.questionId]}
            onShowAnswer={(show) => setShowAnswerMap(prev => ({ ...prev, [q.questionId]: show }))}
          />
        ))}
      </div>
    );
  }

  // 문제 데이터 준비
  const allQuestions = (activeTab === 'wrongCount' ? wrongCountData?.review : recentData?.review) || [];
  const 문제수 = allQuestions.length;

  // 상단에 한 문제씩 보기 토글 및 네비게이션 버튼 추가
  const TopBar = (
    <div className="flex items-center gap-2 mb-4">
      <Button onClick={() => setSingleView(v => !v)}>
        {singleView ? '전체 문제 보기' : '한 문제씩 보기'}
      </Button>
      {singleView && 문제수 > 0 && (
        <span>{currentIdx + 1} / {문제수}</span>
      )}
    </div>
  );

  // 모바일/데스크탑 공통 렌더링 (return문 한 번만 사용)
  return (
    <div className="max-w-2xl mx-auto py-8">
      {TopBar}
      {FilterBar}
      <div className="flex mb-2 border-b">
        <button className={`flex-1 py-2 ${activeTab==='wrongCount' ? 'font-bold border-b-2 border-blue-500' : ''}`} onClick={()=>setActiveTab('wrongCount')}>누적 오답순</button>
        <button className={`flex-1 py-2 ${activeTab==='recent' ? 'font-bold border-b-2 border-blue-500' : ''}`} onClick={()=>setActiveTab('recent')}>최신 오답순</button>
      </div>
      {singleView ? (
        문제수 === 0 ? <div>문제가 없습니다.</div> : <>
          <WrongNoteCard q={allQuestions[currentIdx]} idx={currentIdx} showAnswer={showAnswerMap[allQuestions[currentIdx].questionId]} onShowAnswer={(show) => setShowAnswerMap(prev => ({ ...prev, [allQuestions[currentIdx].questionId]: show }))} />
          <div className="mt-8 flex justify-between items-center">
            <Button
              onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              variant="outline"
            >
              이전 문제
            </Button>
            <span className="text-gray-700 font-medium">
              {currentIdx + 1} / {문제수}
            </span>
            <Button
              onClick={() => setCurrentIdx(i => Math.min(문제수 - 1, i + 1))}
              disabled={currentIdx === 문제수 - 1}
              variant="outline"
            >
              다음 문제
            </Button>
          </div>
        </>
      ) : (
        activeTab === 'wrongCount' ? (
          loading1 ? <div>로딩 중...</div> : error1 ? <div>에러: {error1.message}</div> : <WrongNoteList data={wrongCountData?.review || []} />
        ) : (
          loading2 ? <div>로딩 중...</div> : error2 ? <div>에러: {error2.message}</div> : <WrongNoteList data={recentData?.review || []} />
        )
      )}
      <ImageZoomModal src={imageZoom.zoomedImage} onClose={imageZoom.closeZoom} />
    </div>
  );
}