"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { TagBadge } from "./TagBadge";
import { removeTag, sortTags } from "../utils/tagUtils";
import { ITag } from "../types";
import { toast } from "sonner";
import { Plus, X, ArrowUpDown } from "lucide-react";

interface TagListProps {
  tags: ITag[];
  setTags: (tags: ITag[]) => void;
  selectedTags: ITag[];
  setSelectedTags: (tags: ITag[]) => void;
  onAddNewClick?: () => void;
  maxHeight?: string;
}

export const TagList = ({
  tags,
  setTags,
  selectedTags,
  setSelectedTags,
  onAddNewClick,
  maxHeight = "300px"
}: TagListProps) => {
  const [searchText, setSearchText] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // 태그 검색
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // 태그 정렬
  const sortedTags = sortTags(filteredTags, "name", sortOrder === "asc");

  // 태그 선택 토글
  const toggleTag = (tag: ITag) => {
    if (selectedTags.some(t => t.id === tag.id)) {
      setSelectedTags(selectedTags.filter(t => t.id !== tag.id));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // 태그 삭제
  const handleRemoveTag = (id: string) => {
    // 선택된 태그에서 제거
    if (selectedTags.some(tag => tag.id === id)) {
      setSelectedTags(selectedTags.filter(tag => tag.id !== id));
    }
    
    // 전체 태그 목록에서 제거
    setTags(removeTag(tags, id));
    toast.success("태그가 삭제되었습니다.");
  };

  // 정렬 순서 토글
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          placeholder="태그 검색..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="icon"
          type="button"
          onClick={toggleSortOrder}
          title={`${sortOrder === "asc" ? "내림차순" : "오름차순"} 정렬`}
        >
          <ArrowUpDown size={16} />
        </Button>
        {onAddNewClick && (
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={onAddNewClick}
            title="새 태그 추가"
          >
            <Plus size={16} />
          </Button>
        )}
      </div>

      <ScrollArea className={`border rounded-md p-2`} style={{ maxHeight }}>
        {sortedTags.length > 0 ? (
          <div className="space-y-2">
            {sortedTags.map(tag => {
              const isSelected = selectedTags.some(t => t.id === tag.id);
              return (
                <div 
                  key={tag.id}
                  className={`flex items-center justify-between p-1 rounded-md ${
                    isSelected ? "bg-gray-100" : ""
                  }`}
                >
                  <TagBadge
                    tag={tag}
                    clickable
                    removable={false}
                    onClick={() => toggleTag(tag)}
                  />
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleRemoveTag(tag.id)}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            {searchText ? "검색 결과가 없습니다" : "등록된 태그가 없습니다"}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default TagList; 