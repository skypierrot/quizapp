"use client";

import { X } from "lucide-react";
import { getTagColorClasses } from "../utils/tagUtils";
import { ITag } from "../types";

interface TagBadgeProps {
  tag: ITag;
  onRemove?: (id: string) => void;
  onClick?: (tag: ITag) => void;
  className?: string;
  removable?: boolean;
  clickable?: boolean;
}

export const TagBadge = ({
  tag,
  onRemove,
  onClick,
  className = "",
  removable = true,
  clickable = false,
}: TagBadgeProps) => {
  const { bg, text, border } = getTagColorClasses(tag.color);

  const handleClick = () => {
    if (clickable && onClick) {
      onClick(tag);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (removable && onRemove) {
      onRemove(tag.id);
    }
  };

  return (
    <div
      className={`${bg} ${text} ${border} px-2 py-1 rounded-md text-sm flex items-center border
        ${clickable ? "cursor-pointer hover:opacity-90" : ""} ${className}`}
      onClick={handleClick}
    >
      <span>{tag.name}</span>
      {removable && onRemove && (
        <button
          type="button"
          onClick={handleRemove}
          className="ml-1 hover:text-gray-500"
          aria-label={`Remove ${tag.name} tag`}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default TagBadge; 