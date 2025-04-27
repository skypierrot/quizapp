"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagList } from "./TagList";
import { TagSelector } from "./TagSelector";
import { ITag } from "../types";
import { saveTagsToStorage, loadTagsFromStorage, createTag, getRandomColor } from "../utils/tagUtils";
import { toast } from "sonner";

interface TagManagerProps {
  globalTags: ITag[];
  setGlobalTags: (tags: ITag[]) => void;
  selectedTags: ITag[];
  setSelectedTags: (tags: ITag[]) => void;
  maxTags?: number;
}

export const TagManager = ({
  globalTags,
  setGlobalTags,
  selectedTags,
  setSelectedTags,
  maxTags = 5
}: TagManagerProps) => {
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  // 로컬 스토리지에서 태그 로드
  useEffect(() => {
    try {
      const savedTags = loadTagsFromStorage();
      if (savedTags && savedTags.length > 0) {
        setGlobalTags(savedTags);
      }
    } catch (error) {
      console.error("태그를 로드하는 중 오류 발생:", error);
    }
  }, [setGlobalTags]);

  // 태그 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    if (globalTags.length > 0) {
      saveTagsToStorage(globalTags);
    }
  }, [globalTags]);

  // 새 태그 추가
  const handleAddNewTag = () => {
    if (!newTagName.trim()) {
      toast.error("태그 이름을 입력해주세요.");
      return;
    }

    // 중복 태그 확인
    if (globalTags.some(tag => tag.name.toLowerCase() === newTagName.trim().toLowerCase())) {
      toast.error(`'${newTagName}' 태그가 이미 존재합니다.`);
      return;
    }

    const newTag = createTag(newTagName.trim(), getRandomColor());
    setGlobalTags([...globalTags, newTag]);
    setNewTagName("");
    toast.success(`'${newTagName}' 태그가 추가되었습니다.`);
  };

  // 태그 관리 다이얼로그 열기
  const openManageDialog = () => {
    setIsManageDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">태그</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openManageDialog}
        >
          태그 관리
        </Button>
      </div>

      <TagSelector
        tags={globalTags}
        setTags={setGlobalTags}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        maxTags={maxTags}
        allowNewTags={true}
      />

      {/* 태그 관리 다이얼로그 */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>태그 관리</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* 새 태그 추가 폼 */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label htmlFor="newTag" className="text-sm font-medium mb-1 block">
                  새 태그 추가
                </label>
                <Input
                  id="newTag"
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  placeholder="새 태그 이름"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewTag();
                    }
                  }}
                />
              </div>
              <Button onClick={handleAddNewTag}>추가</Button>
            </div>
            
            {/* 태그 목록 */}
            <div>
              <h4 className="text-sm font-medium mb-2">태그 목록</h4>
              <TagList
                tags={globalTags}
                setTags={setGlobalTags}
                selectedTags={selectedTags}
                setSelectedTags={setSelectedTags}
                maxHeight="300px"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsManageDialogOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TagManager; 