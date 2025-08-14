#!/bin/bash

echo "🔧 API 라우트 타입 수정 시작 (v2)..."

# 주요 API 라우트 파일들을 개별적으로 수정
echo "📝 주요 API 라우트 수정 중..."

# 1. threads 관련
echo "  - threads API 수정..."
sed -i 's/params: { id: string }/params: Promise<{ id: string }>/g' app/api/threads/\[id\]/route.ts
sed -i 's/params: { id: string }/params: Promise<{ id: string }>/g' app/api/threads/\[id\]/comments/route.ts
sed -i 's/params: { id: string }/params: Promise<{ id: string }>/g' app/api/threads/\[id\]/vote/route.ts
sed -i 's/params: { id: string }/params: Promise<{ id: string }>/g' app/api/threads/\[id\]/bookmark/route.ts

# 2. notices 관련
echo "  - notices API 수정..."
sed -i 's/params: { id: string }/params: Promise<{ id: string }>/g' app/api/notices/\[id\]/route.ts

# 3. questions 관련
echo "  - questions API 수정..."
sed -i 's/params: { questionId: string }/params: Promise<{ questionId: string }>/g' app/api/questions/\[questionId\]/image/route.ts
sed -i 's/params: { questionId: string }/params: Promise<{ questionId: string }>/g' app/api/questions/\[questionId\]/explanation/route.ts

# 4. wrong-note 관련
echo "  - wrong-note API 수정..."
sed -i 's/params: { examResultId: string }/params: Promise<{ examResultId: string }>/g' app/api/wrong-note/\[examResultId\]/route.ts

# 5. Request -> NextRequest 변경
echo "  - Request 타입 변경..."
find app/api -name "route.ts" -type f -exec sed -i 's/Request/NextRequest/g' {} \;

echo "✅ API 라우트 타입 수정 완료!"
echo "📝 이제 빌드를 테스트해보세요."
