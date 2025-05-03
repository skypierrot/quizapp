export default function NoticePage() {
  return (
    <div className="container py-8 px-4 mx-auto">
      <h1 className="text-3xl font-bold mb-6">공지사항</h1>
      <div className="space-y-4">
        <div className="p-4 border rounded-lg shadow-sm">
          <h2 className="text-lg font-medium">시스템 점검 안내</h2>
          <p className="text-gray-600 mt-2">2025년 4월 15일 00:00 ~ 06:00</p>
          <p className="text-gray-500 text-sm mt-2">
            정기 시스템 점검으로 인해 서비스 이용이 일시적으로 중단될 예정입니다. 
            이용에 불편을 드려 죄송합니다.
          </p>
        </div>
        
        <div className="p-4 border rounded-lg shadow-sm">
          <h2 className="text-lg font-medium">신규 기능 업데이트 안내</h2>
          <p className="text-gray-600 mt-2">2025년 4월 10일</p>
          <p className="text-gray-500 text-sm mt-2">
            학습 통계 기능이 추가되었습니다. 이제 문제별 정답률과 학습 시간을 
            한눈에 확인하실 수 있습니다.
          </p>
        </div>
        
        <div className="p-4 border rounded-lg shadow-sm">
          <h2 className="text-lg font-medium">플랫폼 오픈 안내</h2>
          <p className="text-gray-600 mt-2">2025년 4월 1일</p>
          <p className="text-gray-500 text-sm mt-2">
            기술자격시험 학습 플랫폼이 정식 오픈하였습니다. 많은 이용 부탁드립니다.
          </p>
        </div>
      </div>
    </div>
  );
} 