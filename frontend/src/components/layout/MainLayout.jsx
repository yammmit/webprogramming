
import BottomNavBar from "../common/BottomNavBar";

export default function MainLayout({ children, top }) {
  return (
    <div
      className="
        min-h-[100dvh]  
        flex flex-col 
        bg-[#F5F5F5]            /* 메인 백그라운드 */
        mx-auto
        w-full
        max-w-[480px]           /* 모바일 중심 */
        lg:max-w-[744px]        /* 태블릿 */
        relative
      "
    >
      {/* 상단 헤더 영역 */}
      <header className="w-full sticky top-0 z-20 bg-[#F5F5F5]">
        {top}
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 w-full px-6 py-4">
        {children}
      </main>

      {/* 하단 네비게이션 */}
      <div className="w-full sticky bottom-0 z-30 bg-white shadow-t-md">
        <BottomNavBar />
      </div>
    </div>
  );
}
