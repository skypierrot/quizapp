interface Stats {
  totalStudyTime: number;
  totalSolved: number;
  correctRate: number;
  streak: number;
  isGlobal?: boolean;
  totalUsers?: number;
}

const StatsSection = () => {

  // 기본 통계 데이터 (API 호출 없이 정적 데이터 사용)
  const defaultStats = {
    totalStudyTime: 960, // 16분 (초 단위)
    totalSolved: 135, // 기본 문제 수
    correctRate: 0.18, // 18%
    streak: 2, // 기본 연속학습일
  };

  const formatAccuracy = (rate: number) => {
    return `${Math.round(rate * 100)}%`;
  };

  const formatTime = (seconds: number) => {
    return `${Math.round(seconds / 60)}분`;
  };

  const formatNumber = (num: number) => {
    return num.toString();
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">전체사용자 종합학습통계</h2>
            <p className="text-sm text-gray-500 mb-4">현재 기본 통계를 표시합니다</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {formatAccuracy(defaultStats.correctRate)}
                </div>
                <div className="text-gray-600 dark:text-gray-400">평균 정답률</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {defaultStats.streak}일
                </div>
                <div className="text-gray-600 dark:text-gray-400">평균 연속학습일</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {formatNumber(defaultStats.totalSolved)}
                </div>
                <div className="text-gray-600 dark:text-gray-400">평균 문제 수</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {formatTime(defaultStats.totalStudyTime)}
                </div>
                <div className="text-gray-600 dark:text-gray-400">평균 학습시간</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection; 