export default function PrivacyPage() {
  return (
    <div className="container py-8 px-4 mx-auto">
      <h1 className="text-3xl font-bold mb-6">개인정보처리방침</h1>
      <div className="prose max-w-none">
        <p className="mb-4">
          (주)기술자격시험 학습 플랫폼(이하 '회사'라 함)은 이용자의 '동의를 기반으로 개인정보를 수집·이용 및 제공'하고 있으며,
          개인정보보호법에 따라 이용자의 개인정보 보호 및 권익을 보호하고 개인정보와 관련한 이용자의 고충을 원활하게 처리할 수 있도록
          다음과 같은 처리방침을 두고 있습니다.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">1. 개인정보의 처리 목적</h2>
        <p className="mb-4">
          회사는 다음의 목적을 위하여 개인정보를 처리하고 있으며, 다음의 목적 이외의 용도로는 이용하지 않습니다.
        </p>
        <ul className="list-disc pl-5 mb-4">
          <li>회원 가입 및 관리: 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지 등</li>
          <li>서비스 제공: 학습 관리, 콘텐츠 제공, 맞춤형 서비스 제공 등</li>
          <li>마케팅 및 광고에의 활용: 이벤트 정보 및 참여기회 제공, 서비스의 유효성 확인 등</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">2. 개인정보의 처리 및 보유 기간</h2>
        <p className="mb-4">
          회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
        </p>
        <ul className="list-disc pl-5 mb-4">
          <li>회원 가입 및 관리: 회원 탈퇴 시까지</li>
          <li>재화 또는 서비스 제공: 서비스 이용 종료 시까지</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">3. 정보주체의 권리·의무 및 그 행사방법</h2>
        <p className="mb-4">
          이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다.
        </p>
        <ul className="list-disc pl-5 mb-4">
          <li>개인정보 열람 요구</li>
          <li>오류 등이 있을 경우 정정 요구</li>
          <li>삭제 요구</li>
          <li>처리정지 요구</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">4. 개인정보의 안전성 확보 조치</h2>
        <p className="mb-4">
          회사는 개인정보보호법에 따라 다음과 같은 안전성 확보 조치를 하고 있습니다.
        </p>
        <ul className="list-disc pl-5 mb-4">
          <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육 등</li>
          <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
          <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">5. 개인정보 보호책임자</h2>
        <p className="mb-4">
          회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여
          아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
        </p>
        <p className="mb-4">
          <strong>개인정보 보호책임자</strong><br />
          이름: 홍길동<br />
          직책: 이사<br />
          연락처: 02-XXX-XXXX, privacy@example.com
        </p>
      </div>
    </div>
  );
} 