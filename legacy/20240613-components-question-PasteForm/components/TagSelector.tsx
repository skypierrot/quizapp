"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { X, Plus, Palette } from "lucide-react";
import { TAG_COLORS, getTagColorClasses, addTag, removeTag } from "../utils/tagUtils";
import { ITag } from "../types";
import { toast } from "sonner";

interface TagSelectorProps {
  tags: ITag[];
  setTags: (tags: ITag[]) => void;
  selectedTags: ITag[];
  setSelectedTags: (tags: ITag[]) => void;
  maxTags?: number;
  allowNewTags?: boolean;
  placeholderText?: string;
}

export const TagSelector = ({
  tags,
  setTags,
  selectedTags,
  setSelectedTags,
  maxTags = 5,
  allowNewTags = true,
  placeholderText = "태그 추가..."
}: TagSelectorProps) => {
  const [inputValue, setInputValue] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState("gray");
  const inputRef = useRef<HTMLInputElement>(null);

  // 태그 선택 상태 토글
  const toggleTag = (tag: ITag) => {
    if (selectedTags.some(t => t.id === tag.id)) {
      setSelectedTags(selectedTags.filter(t => t.id !== tag.id));
    } else {
      if (selectedTags.length >= maxTags) {
        toast.error(`최대 ${maxTags}개의 태그까지 선택할 수 있습니다.`);
        return;
      }
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // 새 태그 생성 및 추가
  const handleAddNewTag = () => {
    if (!newTagName.trim()) {
      toast.error("태그 이름을 입력해주세요.");
      return;
    }

    const updatedTags = addTag(tags, newTagName, selectedColor);
    
    // 태그가 성공적으로 추가되었는지 확인
    if (updatedTags.length > tags.length) {
      setTags(updatedTags);
      const newTag = updatedTags[updatedTags.length - 1];
      
      // 새 태그 바로 선택하기
      if (selectedTags.length < maxTags) {
        setSelectedTags([...selectedTags, newTag]);
      }
      
      // 입력 필드 초기화
      setNewTagName("");
      setSelectedColor("gray");
      setIsDialogOpen(false);
    }
  };

  // 선택된 태그 제거
  const handleRemoveSelectedTag = (tagId: string) => {
    setSelectedTags(selectedTags.filter(tag => tag.id !== tagId));
  };

  // 기존 태그 제거
  const handleRemoveTag = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 먼저 선택된 태그에서 제거
    if (selectedTags.some(tag => tag.id === tagId)) {
      setSelectedTags(selectedTags.filter(tag => tag.id !== tagId));
    }
    
    // 전체 태그 목록에서 제거
    setTags(removeTag(tags, tagId));
    toast.success("태그가 삭제되었습니다.");
  };

  // 입력값에 따른 태그 필터링
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="w-full space-y-2">
      {/* 선택된 태그 표시 영역 */}
      <div className="flex flex-wrap gap-2 min-h-8">
        {selectedTags.map(tag => {
          const { bg, text, border } = getTagColorClasses(tag.color);
          return (
            <div
              key={tag.id}
              className={`${bg} ${text} ${border} px-2 py-1 rounded-md text-sm flex items-center border`}
            >
              <span>{tag.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveSelectedTag(tag.id)}
                className="ml-1 hover:text-gray-500"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* 태그 입력 및 선택 영역 */}
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder={placeholderText}
          className="w-full"
        />
        
        {allowNewTags && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus size={18} />
          </Button>
        )}
      </div>

      {/* 태그 선택 목록 */}
      {inputValue && (
        <div className="border rounded-md shadow-sm divide-y max-h-60 overflow-y-auto">
          {filteredTags.length > 0 ? (
            filteredTags.map(tag => {
              const isSelected = selectedTags.some(t => t.id === tag.id);
              const { bg, text, border } = getTagColorClasses(tag.color);
              return (
                <div
                  key={tag.id}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-2 cursor-pointer flex items-center justify-between hover:bg-gray-50 ${
                    isSelected ? "bg-gray-50" : ""
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${bg.replace('bg-', 'bg-')}`}></div>
                    <span className={`${isSelected ? "font-medium" : ""}`}>{tag.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={e => handleRemoveTag(tag.id, e)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="px-3 py-2 text-gray-500">일치하는 태그가 없습니다</div>
          )}
        </div>
      )}

      {/* 새 태그 생성 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 태그 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="tagName" className="text-sm font-medium">태그 이름</label>
              <Input
                id="tagName"
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                placeholder="새 태그 이름"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">태그 색상</label>
              <div className="grid grid-cols-6 gap-2">
                {TAG_COLORS.map(color => {
                  const { bg } = getTagColorClasses(color);
                  return (
                    <div
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full cursor-pointer ${bg} ${
                        selectedColor === color ? "ring-2 ring-offset-2 ring-blue-500" : ""
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleAddNewTag}>
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TagSelector; 