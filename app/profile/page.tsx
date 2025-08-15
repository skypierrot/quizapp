'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Edit2, Check, X, AlertCircle } from 'lucide-react';
import useSWR from 'swr';

interface UserStats {
  examCount: number;
  solvedQuestions: number;
  postCount: number;
  commentCount: number;
  averageScore: number;
  correctRate: number;
}

// SWR fetcher 함수 정의
const fetcher = (url: string) => fetch(url, { 
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  }
}).then(res => {
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res.json();
});

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 통계 데이터 가져오기 (세션이 있을 때만 호출)
  const { data: stats, error, isLoading: isLoadingStats } = useSWR<UserStats>(
    session?.user?.id ? '/api/profile/stats' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  useEffect(() => {
    if (session?.user?.nickname) {
      setNewNickname(session.user.nickname);
    }
  }, [session?.user?.nickname]);

  // 통계 데이터 로딩 오류 처리
  useEffect(() => {
    if (error) {
      console.error('Profile stats error:', error);
      toast({
        title: '통계 데이터 로딩 실패',
        description: '프로필 통계를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.',
        variant: 'error',
      });
    }
  }, [error, toast]);

  const handleNicknameChange = async () => {
    if (!newNickname.trim()) {
      toast({
        title: '닉네임을 입력해주세요',
        variant: 'error',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/profile/nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: newNickname }),
      });

      if (!response.ok) {
        throw new Error('닉네임 변경에 실패했습니다');
      }

      await update(); // 세션 업데이트
      setIsEditing(false);
      toast({
        title: '닉네임이 변경되었습니다',
      });
    } catch (error) {
      toast({
        title: '닉네임 변경 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">로그인이 필요합니다</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>프로필</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label>이메일</Label>
                <p className="text-sm text-gray-500">{session.user.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label>닉네임</Label>
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      value={newNickname}
                      onChange={(e) => setNewNickname(e.target.value)}
                      disabled={isLoading}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleNicknameChange}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setIsEditing(false);
                        setNewNickname(session.user.nickname || '');
                      }}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-500">
                      {session.user.nickname || '닉네임을 설정해주세요'}
                    </p>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* 디버깅 정보 (개발 환경에서만 표시) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                <p className="text-xs text-gray-600">
                  <strong>디버깅 정보:</strong><br />
                  User ID: {session.user.id || '없음'}<br />
                  Stats Loading: {isLoadingStats ? '로딩 중' : '완료'}<br />
                  Stats Error: {error ? error.message : '없음'}<br />
                  Stats Data: {stats ? '있음' : '없음'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">시험 응시</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="flex items-center space-x-2 text-red-500">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">오류</span>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.examCount || 0
                  )}
                </p>
                <p className="text-sm text-gray-500">회</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">푼 문제</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="flex items-center space-x-2 text-red-500">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">오류</span>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.solvedQuestions || 0
                  )}
                </p>
                <p className="text-sm text-gray-500">문제</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">평균 점수</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="flex items-center space-x-2 text-red-500">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">오류</span>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    `${stats?.averageScore || 0}점`
                  )}
                </p>
                <p className="text-sm text-gray-500">정답률 {stats?.correctRate || 0}%</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">게시글</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="flex items-center space-x-2 text-red-500">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">오류</span>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stats?.postCount || 0
                  )}
                </p>
                <p className="text-sm text-gray-500">댓글 {stats?.commentCount || 0}개</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 