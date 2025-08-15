export default function FAQPage() {
  return (
    <div className="container py-8 px-4 mx-auto">
      <h1 className="text-3xl font-bold mb-6">자주 묻는 질문</h1>
      <div className="space-y-6">
        <div className="p-4 border rounded-lg shadow-sm">
          <h2 className="text-lg font-medium">Q. 회원가입은 어떻게 하나요?</h2>
          <p className="text-gray-600 mt-2">
            A. 상단 메뉴의 '회원가입' 버튼을 클릭하여 진행할 수 있습니다. 
            이메일과 비밀번호를 입력하고 가입 절차를 완료하면 됩니다.
          </p>
        </div>
        
        <div className="p-4 border rounded-lg shadow-sm">
          <h2 className="text-lg font-medium">Q. 아이디나 비밀번호를 잊어버렸어요.</h2>
          <p className="text-gray-600 mt-2">
            A. 로그인 페이지에서 '비밀번호 찾기' 링크를 클릭하여 등록된 이메일로 
            재설정 링크를 받으실 수 있습니다.
          </p>
        </div>
        
        <div className="p-4 border rounded-lg shadow-sm">
          <h2 className="text-lg font-medium">Q. 오답 노트는 어떻게 사용하나요?</h2>
          <p className="text-gray-600 mt-2">
            A. 모의고사나 문제 풀이 후 틀린 문제는 자동으로 오답 노트에 저장됩니다. 
            '오답 노트' 메뉴에서 틀린 문제들을 복습하고 개념을 정리할 수 있습니다.
          </p>
        </div>
        
        <div className="p-4 border rounded-lg shadow-sm">
          <h2 className="text-lg font-medium">Q. 학습 통계는 어떤 정보를 보여주나요?</h2>
          <p className="text-gray-600 mt-2">
            A. 학습 통계에서는 푼 문제 수, 정답률, 학습 시간, 약점 분야 등 
            다양한 학습 관련 정보를 그래프와 차트로 확인할 수 있습니다.
          </p>
        </div>
        
        <div className="p-4 border rounded-lg shadow-sm">
          <h2 className="text-lg font-medium">Q. 모바일에서도 사용할 수 있나요?</h2>
          <p className="text-gray-600 mt-2">
            A. 네, 모바일 브라우저에서도 최적화된 환경으로 서비스를 이용하실 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
} 