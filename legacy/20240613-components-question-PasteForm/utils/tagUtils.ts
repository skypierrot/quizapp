import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { ITag } from "../types";

// 사용 가능한 색상 목록 정의
export const TAG_COLORS = [
  "gray",
  "red",
  "orange",
  "amber",
  "yellow", 
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
];

/**
 * 색상 이름에서 CSS 클래스 이름으로 변환
 * @param color 색상 이름
 * @returns CSS 클래스 문자열
 */
export const getTagColorClasses = (color: string = "gray"): { bg: string; text: string; border: string } => {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    gray: { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-300" },
    red: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" },
    orange: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300" },
    amber: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300" },
    yellow: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300" },
    lime: { bg: "bg-lime-100", text: "text-lime-800", border: "border-lime-300" },
    green: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
    emerald: { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300" },
    teal: { bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-300" },
    cyan: { bg: "bg-cyan-100", text: "text-cyan-800", border: "border-cyan-300" },
    sky: { bg: "bg-sky-100", text: "text-sky-800", border: "border-sky-300" },
    blue: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
    indigo: { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-300" },
    violet: { bg: "bg-violet-100", text: "text-violet-800", border: "border-violet-300" },
    purple: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300" },
    fuchsia: { bg: "bg-fuchsia-100", text: "text-fuchsia-800", border: "border-fuchsia-300" },
    pink: { bg: "bg-pink-100", text: "text-pink-800", border: "border-pink-300" },
    rose: { bg: "bg-rose-100", text: "text-rose-800", border: "border-rose-300" },
  };

  return colorMap[color] || colorMap.gray;
};

/**
 * 랜덤 색상 가져오기
 * @returns 랜덤 색상 이름
 */
export const getRandomColor = (): string => {
  const randomIndex = Math.floor(Math.random() * TAG_COLORS.length);
  return TAG_COLORS[randomIndex];
};

/**
 * 새로운 태그 객체 생성
 * @param name 태그 이름
 * @param color 태그 색상 (기본값: 랜덤 색상)
 * @returns 생성된 태그 객체
 */
export const createTag = (name: string, color?: string): ITag => {
  return {
    id: uuidv4(),
    name: name.trim(),
    color: color || getRandomColor(),
  };
};

/**
 * 태그 목록에 새 태그 추가
 * @param tags 기존 태그 목록
 * @param name 새 태그 이름
 * @param color 새 태그 색상 (기본값: 랜덤 색상)
 * @returns 업데이트된 태그 목록
 */
export const addTag = (tags: ITag[], name: string, color?: string): ITag[] => {
  // 빈 태그 추가 방지
  if (!name.trim()) {
    toast.error("태그 이름은 비워둘 수 없습니다");
    return tags;
  }
  
  // 중복 태그 추가 방지
  if (tags.some(tag => tag.name.toLowerCase() === name.trim().toLowerCase())) {
    toast.error(`'${name}' 태그가 이미 존재합니다`);
    return tags;
  }
  
  const newTag = createTag(name, color);
  toast.success(`'${name}' 태그가 추가되었습니다`);
  return [...tags, newTag];
};

/**
 * 태그 목록에서 태그 제거
 * @param tags 기존 태그 목록
 * @param tagId 제거할 태그 ID
 * @returns 업데이트된 태그 목록
 */
export const removeTag = (tags: ITag[], tagId: string): ITag[] => {
  return tags.filter(tag => tag.id !== tagId);
};

/**
 * 태그 목록에서 태그 업데이트
 * @param tags 기존 태그 목록
 * @param updatedTag 업데이트된 태그 정보
 * @returns 업데이트된 태그 목록
 */
export const updateTag = (tags: ITag[], updatedTag: ITag): ITag[] => {
  return tags.map(tag => (tag.id === updatedTag.id ? updatedTag : tag));
};

/**
 * 태그 목록 필터링
 * @param tags 태그 목록
 * @param searchText 검색어
 * @returns 필터링된 태그 목록
 */
export const filterTags = (tags: ITag[], searchText: string): ITag[] => {
  if (!searchText.trim()) return tags;
  
  const searchLower = searchText.toLowerCase().trim();
  return tags.filter(tag => tag.name.toLowerCase().includes(searchLower));
};

/**
 * 태그 이름으로 태그 찾기
 * @param tags 태그 목록
 * @param name 찾을 태그 이름
 * @returns 찾은 태그 또는 undefined
 */
export const findTagByName = (tags: ITag[], name: string): ITag | undefined => {
  return tags.find(tag => tag.name.toLowerCase() === name.toLowerCase().trim());
};

/**
 * 태그 ID로 태그 찾기
 * @param tags 태그 목록
 * @param id 찾을 태그 ID
 * @returns 찾은 태그 또는 undefined
 */
export const findTagById = (tags: ITag[], id: string): ITag | undefined => {
  return tags.find(tag => tag.id === id);
};

/**
 * 태그 목록 정렬
 * @param tags 태그 목록
 * @param sortBy 정렬 기준 ('name' | 'color')
 * @param ascending 오름차순 여부
 * @returns 정렬된 태그 목록
 */
export const sortTags = (
  tags: ITag[], 
  sortBy: 'name' | 'color' = 'name', 
  ascending: boolean = true
): ITag[] => {
  return [...tags].sort((a, b) => {
    const aValue = sortBy === 'name' ? a.name : a.color;
    const bValue = sortBy === 'name' ? b.name : b.color;
    
    if (aValue < bValue) return ascending ? -1 : 1;
    if (aValue > bValue) return ascending ? 1 : -1;
    return 0;
  });
};

/**
 * 태그 데이터를 로컬 스토리지에 저장
 * @param tags 저장할 태그 목록
 * @param key 저장 키 (기본값: 'globalTags')
 */
export const saveTagsToStorage = (tags: ITag[], key: string = 'globalTags'): void => {
  try {
    localStorage.setItem(key, JSON.stringify(tags));
  } catch (error) {
    console.error('태그 저장 오류:', error);
  }
};

/**
 * 로컬 스토리지에서 태그 데이터 로드
 * @param key 저장 키 (기본값: 'globalTags')
 * @returns 로드된 태그 목록 또는 빈 배열
 */
export const loadTagsFromStorage = (key: string = 'globalTags'): ITag[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('태그 로드 오류:', error);
    return [];
  }
}; 