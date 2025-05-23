import { Button } from '@/components/ui/button';
import { ChevronUp, MessageSquarePlus } from 'lucide-react';

interface OptionMemoUIProps {
  optionIndex: number;
  optionsMemoText: Record<number, string | null>;
  editingOptionMemo: Record<number, { localEditText: string }> | null;
  showOptionMemoUI: Record<number, boolean>;
  loadingOptionMemo: Record<number, boolean>;
  handleToggleOptionMemoUI: (optionIndex: number) => void;
  handleEditOptionMemo: (optionIndex: number) => void;
  handleCancelEditOptionMemo: (optionIndex: number) => void;
  handleSaveOptionMemo: (optionIndex: number) => void;
}

export function OptionMemoUI({
  optionIndex,
  optionsMemoText,
  editingOptionMemo,
  showOptionMemoUI,
  loadingOptionMemo,
  handleToggleOptionMemoUI,
  handleEditOptionMemo,
  handleCancelEditOptionMemo,
  handleSaveOptionMemo,
}: OptionMemoUIProps) {
  return (
    <>
      <button
        onClick={e => { e.stopPropagation(); handleToggleOptionMemoUI(optionIndex); }}
        className="absolute top-2 right-2 p-1 w-8 h-8 flex items-center justify-center text-blue-500 hover:text-blue-700 transition-colors z-20 bg-white bg-opacity-80 rounded-full shadow"
        title={showOptionMemoUI[optionIndex] ? '메모 숨기기' : '메모 보기/작성'}
      >
        {showOptionMemoUI[optionIndex] ? <ChevronUp className="w-5 h-5" /> : <MessageSquarePlus className="w-5 h-5" />}
      </button>
      {showOptionMemoUI[optionIndex] && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          {loadingOptionMemo[optionIndex] ? (
            <p className="text-xs text-gray-500">메모 로딩 중...</p>
          ) : editingOptionMemo && editingOptionMemo[optionIndex] !== undefined ? (
            <div className="space-y-1">
              <textarea
                value={editingOptionMemo[optionIndex].localEditText}
                onChange={e => handleEditOptionMemo(optionIndex)}
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
              <p className="text-xs text-gray-700 whitespace-pre-wrap min-h-[20px]">
                {optionsMemoText[optionIndex] === '' ? (
                  <span className="text-gray-400">메모 없음</span>
                ) : (
                  optionsMemoText[optionIndex]
                )}
              </p>
              <div className="flex justify-end">
                <Button size="sm" variant="ghost" onClick={() => handleEditOptionMemo(optionIndex)}>수정</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
} 