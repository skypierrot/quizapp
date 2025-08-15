'use client'

import { Button } from '@/components/ui/button';
import { ChevronUp, Pencil } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface OptionMemoUIProps {
  optionIndex: number;
  optionsMemoText: Record<number, string | null>;
  editingOptionMemo: Record<number, { localEditText: string }> | null;
  showOptionMemoUI: Record<number, boolean>;
  loadingOptionMemo: Record<number, boolean>;
  handleToggleOptionMemoUI: (optionIndex: number) => void;
  handleEditOptionMemo: (optionIndex: number, localEditText: string) => void;
  handleCancelEditOptionMemo: (optionIndex: number) => void;
  handleSaveOptionMemo: (optionIndex: number) => void;
}

export function OptionMemoButton({
  optionIndex,
  showOptionMemoUI,
  handleToggleOptionMemoUI,
}: OptionMemoUIProps) {
  return (
    <button
      onClick={e => { e.stopPropagation(); handleToggleOptionMemoUI(optionIndex); }}
      className={`p-1 w-6 h-6 flex items-center justify-center transition-colors z-20 rounded-full ${
        showOptionMemoUI[optionIndex] 
          ? 'text-blue-600 bg-blue-100 hover:bg-blue-200' 
          : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
      }`}
      title={showOptionMemoUI[optionIndex] ? '메모 숨기기' : '메모 보기/작성'}
    >
      {showOptionMemoUI[optionIndex] ? <ChevronUp className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
    </button>
  );
}

function renderMarkdown(text: string) {
  if (!text) return '';
  // marked로 마크다운을 HTML로 변환 후, DOMPurify로 XSS 방지
  const renderer = new marked.Renderer();
  return DOMPurify.sanitize(marked.parse(text, { renderer, async: false }));
}

export function OptionMemoContent({
  optionIndex,
  optionsMemoText,
  editingOptionMemo,
  showOptionMemoUI,
  loadingOptionMemo,
  handleEditOptionMemo,
  handleCancelEditOptionMemo,
  handleSaveOptionMemo,
}: OptionMemoUIProps) {
  if (!showOptionMemoUI[optionIndex]) return null;
  return (
    <div className="mt-2 pt-2 border-t border-gray-200">
      {loadingOptionMemo[optionIndex] ? (
        <p className="text-xs text-gray-500">메모 로딩 중...</p>
      ) : editingOptionMemo && editingOptionMemo[optionIndex] !== undefined ? (
        <div className="space-y-1">
          <textarea
            value={editingOptionMemo[optionIndex].localEditText}
            onChange={e => handleEditOptionMemo(optionIndex, e.target.value)}
            className="w-full border rounded p-1.5 text-xs"
            rows={2}
            placeholder="선택지 메모 입력..."
          />
          <div className="flex gap-1 justify-end">
            <Button size="sm" variant="outline" onClick={() => handleCancelEditOptionMemo(optionIndex)}>취소</Button>
            <Button size="sm" onClick={() => handleSaveOptionMemo(optionIndex)}>저장</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <p
            className="text-xs text-gray-700 whitespace-pre-wrap min-h-[20px]"
            dangerouslySetInnerHTML={{
              __html:
                optionsMemoText[optionIndex] === ''
                  ? '<span class="text-gray-400">메모 없음</span>'
                  : renderMarkdown(optionsMemoText[optionIndex] || ''),
            }}
          />
          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => handleEditOptionMemo(optionIndex, optionsMemoText[optionIndex] ?? '')}>수정</Button>
          </div>
        </div>
      )}
    </div>
  );
} 