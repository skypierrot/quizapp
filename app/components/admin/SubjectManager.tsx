import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/components/ui/use-toast';

export default function SubjectManager() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // 과목별 통계 로드
  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/migrate-subjects');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `통계 로드 실패 (${response.status})`);
      }
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || '통계 데이터를 불러오는 중 오류가 발생했습니다.');
      toast({
        title: '오류 발생',
        description: err.message || '통계 데이터를 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // 과목 마이그레이션 실행
  const runMigration = async () => {
    setMigrating(true);
    setError(null);
    try {
      const response = await fetch('/api/migrate-subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `마이그레이션 실패 (${response.status})`);
      }
      
      const result = await response.json();
      toast({
        title: '마이그레이션 완료',
        description: `${result.totalUpdated}개 문항의 과목 정보를 업데이트했습니다.`,
        variant: 'success'
      });
      
      // 통계 다시 로드
      loadStats();
    } catch (err: any) {
      setError(err.message || '과목 정보 마이그레이션 중 오류가 발생했습니다.');
      toast({
        title: '오류 발생',
        description: err.message || '과목 정보 마이그레이션 중 오류가 발생했습니다.',
        variant: 'destructive'
      });
    } finally {
      setMigrating(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    loadStats();
  }, []);

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gray-50">
        <CardTitle className="flex justify-between items-center">
          <span>과목 정보 관리</span>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={loadStats} 
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-6">
            <LoadingSpinner size="lg" />
          </div>
        ) : stats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="text-sm text-blue-500 font-medium">총 문항 수</div>
                <div className="text-2xl font-bold">{stats.totalQuestions}</div>
              </div>
              <div className={`${stats.missingSubjectCount > 0 ? 'bg-yellow-50' : 'bg-green-50'} p-4 rounded-md`}>
                <div className={`text-sm ${stats.missingSubjectCount > 0 ? 'text-yellow-600' : 'text-green-600'} font-medium`}>
                  과목 미지정 문항
                </div>
                <div className="text-2xl font-bold">{stats.missingSubjectCount}</div>
              </div>
              <div className="bg-indigo-50 p-4 rounded-md">
                <div className="text-sm text-indigo-500 font-medium">고유 과목 수</div>
                <div className="text-2xl font-bold">{stats.subjectStats?.length || 0}</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">과목별 문항 수</h3>
              {stats.subjectStats && stats.subjectStats.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/2">과목명</TableHead>
                        <TableHead>문항 수</TableHead>
                        <TableHead className="text-right">비율</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.subjectStats.map((stat: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {stat.subject || '(미지정)'}
                          </TableCell>
                          <TableCell>{stat.count}</TableCell>
                          <TableCell className="text-right">
                            {stats.totalQuestions > 0
                              ? `${((stat.count / stats.totalQuestions) * 100).toFixed(1)}%`
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-gray-500 italic">과목 통계 정보가 없습니다.</div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">과목 정보 마이그레이션</h3>
              <p className="text-sm text-gray-600 mb-4">
                과목 정보가 없는 문항들에 대해 시험 정보를 기반으로 자동으로 과목을 설정합니다.
                이 과정은 시간이 다소 소요될 수 있습니다.
              </p>
              <Button 
                variant="default"
                onClick={runMigration}
                disabled={migrating || (stats.missingSubjectCount === 0)}
                className="w-full md:w-auto"
              >
                {migrating ? (
                  <>
                    <LoadingSpinner className="mr-2" size="sm" />
                    과목 정보 업데이트 중...
                  </>
                ) : (
                  stats.missingSubjectCount > 0 ? (
                    <>과목 정보 자동 설정</>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      모든 문항에 과목 정보가 있습니다
                    </>
                  )
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">통계 정보를 불러오는 중입니다...</div>
        )}
      </CardContent>
    </Card>
  );
} 