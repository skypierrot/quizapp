import { NextRequest, NextResponse } from 'next/server';

export interface NewSummaryStat {
  totalStudyTime: number;
  totalSolved: number;
  correctRate: number;
  streak: number;
  message: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  console.log(`[API /api/new-summary] NextNextRequest received. userId: ${userId || 'N/A (Global)'}`);

  // 더미 데이터 생성
  const dummyData: NewSummaryStat = {
    totalStudyTime: userId ? 12345 : 54321, // userId 유무에 따라 다른 값
    totalSolved: userId ? 150 : 500,
    correctRate: userId ? 0.75 : 0.60,
    streak: userId ? 5 : 0, // 비로그인 시 streak 0
    message: `This is new summary data for ${userId ? 'user ' + userId : 'global stats'}`
  };

  console.log('[API /api/new-summary] Returning dummy data:', JSON.stringify(dummyData));
  return NextResponse.json(dummyData);
} 