import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';

export const useExamFavorites = () => {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // 즐겨찾기 목록 가져오기
  const fetchFavorites = useCallback(async () => {
    if (!session?.user?.id) {
      setFavorites([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/exam-favorites');
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      } else {
        console.error('즐겨찾기 목록 조회 실패');
      }
    } catch (error) {
      console.error('즐겨찾기 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // 즐겨찾기 추가/제거
  const toggleFavorite = useCallback(async (examName: string) => {
    if (!session?.user?.id) {
      toast({
        title: "로그인 필요",
        description: "즐겨찾기 기능을 사용하려면 로그인해주세요.",
      });
      return;
    }

    const isCurrentlyFavorite = favorites.includes(examName);
    const newIsFavorite = !isCurrentlyFavorite;

    try {
      const response = await fetch('/api/exam-favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examName, isFavorite: newIsFavorite }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // 로컬 상태 업데이트
        if (newIsFavorite) {
          setFavorites(prev => [...prev, examName]);
        } else {
          setFavorites(prev => prev.filter(name => name !== examName));
        }

        toast({
          title: newIsFavorite ? "즐겨찾기 추가" : "즐겨찾기 제거",
          description: data.message,
        });
      } else {
        throw new Error('즐겨찾기 설정 실패');
      }
    } catch (error) {
      console.error('즐겨찾기 설정 오류:', error);
      toast({
        title: "오류",
        description: "즐겨찾기 설정 중 오류가 발생했습니다.",
      });
    }
  }, [session?.user?.id, favorites, toast]);

  // 즐겨찾기 여부 확인
  const isFavorite = useCallback((examName: string) => {
    return favorites.includes(examName);
  }, [favorites]);

  // 컴포넌트 마운트 시 즐겨찾기 목록 가져오기
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
    fetchFavorites,
  };
}; 