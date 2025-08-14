#!/bin/bash

echo "🔧 API 라우트 타입 수정 시작..."

# 1. params: { params: { id: string } } -> params: Promise<{ id: string }>
find app/api -name "route.ts" -type f -exec sed -i 's/params: \{ params: \{ \([^}]*\) \}/params: Promise<{ \1 }>/g' {} \;

# 2. params.id -> await params로 변경
find app/api -name "route.ts" -type f -exec sed -i 's/params\.\([a-zA-Z]\+\)/await params.\1/g' {} \;

# 3. const { id: examId } = await params; 패턴으로 변경
find app/api -name "route.ts" -type f -exec sed -i 's/const \([a-zA-Z]\+\) = params\.\([a-zA-Z]\+\);/const { \2: \1 } = await params;/g' {} \;

# 4. Request -> NextRequest 변경
find app/api -name "route.ts" -type f -exec sed -i 's/Request/NextRequest/g' {} \;

echo "✅ API 라우트 타입 수정 완료!"
echo "📝 수정된 파일들을 확인하고 필요시 추가 수정을 진행하세요."
