"use client";

import { useState, useEffect } from "react";

interface WithdrawalThanksModalProps {
  isOpen: boolean;
}

export default function WithdrawalThanksModal({ isOpen }: WithdrawalThanksModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    }
  }, [isOpen]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-2xl rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="absolute right-4 top-4 rounded-full p-1 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 transition-colors"
          aria-label="닫기"
        >
          ✕
        </button>

        <div className="px-10 pb-10 pt-14 text-center">
          <h2 className="text-2xl font-bold text-zinc-50">
            DevRoad를 이용해주셔서 감사합니다.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-300">
            언제든 돌아오셔도 좋습니다!
            <br />
            당신과 함께여서 행복했어요. 꼭 좋은 일 있으시길 바랄게요!
          </p>
        </div>

        <div className="h-32 w-full bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400 rounded-t-[40px] -mb-6" />
      </div>
    </div>
  );
}

