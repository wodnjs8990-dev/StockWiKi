import { NextResponse } from 'next/server';

// 어닝 데이터는 정적 파일로 관리합니다.
// data/earnings.ts 에 직접 입력 후 여기서 불러옵니다.
// TODO: 자료 입력 후 아래 import 활성화
// import { EARNINGS } from '@/data/earnings';

export async function GET() {
  return NextResponse.json({
    ok: true,
    earnings: [], // 자료 입력 전 빈 상태
    updatedAt: new Date().toISOString(),
  });
}
