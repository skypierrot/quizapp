export default function TermsPage() {
  return (
    <div className="container py-8 px-4 mx-auto">
      <h1 className="text-3xl font-bold mb-6">이용약관</h1>
      <div className="prose max-w-none">
        <p className="mb-4">
          본 약관은 (주)기술자격시험 학습 플랫폼(이하 '회사')이 운영하는 웹사이트(이하 '서비스')를 이용함에 있어 
          회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">제1조 (목적)</h2>
        <p className="mb-4">
          이 약관은 회사가 온라인으로 제공하는 서비스(이하 "서비스"라 한다)를 이용함에 있어 회사와 이용자의 권리·의무 및 책임사항을 
          규정함을 목적으로 합니다.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">제2조 (정의)</h2>
        <ol className="list-decimal pl-5 mb-4">
          <li>
            "서비스"라 함은 회사가 제공하는 기술자격시험 학습 관련 제반 서비스를 의미합니다.
          </li>
          <li>
            "이용자"란 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.
          </li>
          <li>
            "회원"이라 함은 서비스에 회원등록을 한 자로서, 계속적으로 회사가 제공하는 서비스를 이용할 수 있는 자를 말합니다.
          </li>
          <li>
            "비회원"이라 함은 회원에 가입하지 않고 회사가 제공하는 서비스를 이용하는 자를 말합니다.
          </li>
        </ol>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">제3조 (약관의 게시와 개정)</h2>
        <ol className="list-decimal pl-5 mb-4">
          <li>
            회사는 이 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.
          </li>
          <li>
            회사는 필요한 경우 관련법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.
          </li>
          <li>
            회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 서비스 초기화면에 그 적용일자 7일 이전부터 
            적용일자 전일까지 공지합니다.
          </li>
        </ol>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">제4조 (서비스의 제공 및 변경)</h2>
        <ol className="list-decimal pl-5 mb-4">
          <li>
            회사는 다음과 같은 업무를 수행합니다.
            <ul className="list-disc pl-5 my-2">
              <li>기술자격시험 관련 학습 컨텐츠 제공</li>
              <li>기술자격시험 모의고사 서비스 제공</li>
              <li>학습 데이터 관리 및 통계 서비스 제공</li>
            </ul>
          </li>
          <li>
            회사는 서비스의 내용, 이용방법, 이용시간에 대하여 변경이 있는 경우에는 변경사유, 변경될 서비스의 내용 및 제공일자 등을 
            그 변경 전에 서비스 화면에 공지합니다.
          </li>
        </ol>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">제5조 (서비스 이용시간)</h2>
        <ol className="list-decimal pl-5 mb-4">
          <li>
            서비스 이용은 회사의 업무상 또는 기술상 특별한 지장이 없는 한 연중무휴, 1일 24시간 운영을 원칙으로 합니다.
          </li>
          <li>
            회사는 시스템 정기점검, 증설 및 교체를 위해 회사가 정한 날이나 시간에 서비스를 일시 중단할 수 있으며, 
            예정되어 있는 작업으로 인한 서비스 일시 중단은 서비스 화면에 공지합니다.
          </li>
        </ol>
      </div>
    </div>
  );
} 