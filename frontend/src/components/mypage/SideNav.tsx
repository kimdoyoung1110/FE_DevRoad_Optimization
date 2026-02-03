"use client";

// 탭 타입 정의 (설정 제거됨)
type TabKey = "resume" | "favorites";

interface SideNavProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

export default function SideNav({ active, onChange }: SideNavProps) {
  // 개별 메뉴 아이템 컴포넌트
  const NavItem = ({ id, label }: { id: TabKey; label: string }) => (
    <button
      onClick={() => onChange(id)}
      className={[
        "w-full rounded-xl px-4 py-3 text-left text-sm transition-all duration-200",
        active === id
          ? "bg-white/10 text-white font-bold shadow-sm ring-1 ring-white/10" // 활성화 스타일 강화
          : "bg-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-100", // 비활성화 상태
      ].join(" ")}
    >
      {label}
    </button>
  );

  return (
    <nav className="h-fit rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 backdrop-blur-sm">
      <div className="space-y-2">
        <NavItem id="resume" label="이력서 관리" />
        <NavItem id="favorites" label="즐겨찾기 목록" />
      </div>
    </nav>
  );
}