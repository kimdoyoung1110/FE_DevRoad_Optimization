import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 클래스명 병합 유틸리티
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 날짜 포맷팅
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// 숫자 포맷팅 (천 단위 콤마)
export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

// 퍼센트 포맷팅
export function formatPercent(num: number): string {
  return `${num.toFixed(1)}%`;
}

// 변화율 표시 (상승/하락)
export function formatChangeRate(rate: number): string {
  const prefix = rate > 0 ? '+' : '';
  return `${prefix}${rate.toFixed(1)}%`;
}
