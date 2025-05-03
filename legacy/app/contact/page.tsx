export default function ContactPage() {
  return (
    <div className="container py-8 px-4 mx-auto">
      <h1 className="text-3xl font-bold mb-6">문의하기</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">문의 방법</h2>
          <p className="text-gray-600 mb-6">
            기술자격시험 학습 플랫폼에 대한 문의사항이 있으시면 아래 연락처로 문의해 주세요.
            담당자가 빠른 시일 내에 답변 드리겠습니다.
          </p>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">이메일</h3>
              <p className="text-gray-600">support@example.com</p>
            </div>
            
            <div>
              <h3 className="font-medium">전화번호</h3>
              <p className="text-gray-600">02-XXX-XXXX (평일 09:00 ~ 18:00)</p>
            </div>
            
            <div>
              <h3 className="font-medium">주소</h3>
              <p className="text-gray-600">서울특별시 강남구 테헤란로 123 기술빌딩 4층</p>
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">문의 양식</h2>
          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                이름
              </label>
              <input
                type="text"
                id="name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="이름을 입력하세요"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="이메일을 입력하세요"
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                문의 유형
              </label>
              <select
                id="category"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">문의 유형을 선택하세요</option>
                <option value="service">서비스 이용 문의</option>
                <option value="payment">결제 관련 문의</option>
                <option value="content">콘텐츠 관련 문의</option>
                <option value="bug">오류 신고</option>
                <option value="other">기타 문의</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                문의 내용
              </label>
              <textarea
                id="message"
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="문의 내용을 입력하세요"
              ></textarea>
            </div>
            
            <div>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                문의하기
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">자주 묻는 질문</h2>
        <p className="text-gray-600 mb-2">
          문의하기 전에 <a href="/faq" className="text-blue-600 hover:underline">자주 묻는 질문</a>을 확인해 보세요.
          많은 질문들이 이미 답변되어 있을 수 있습니다.
        </p>
      </div>
    </div>
  );
} 