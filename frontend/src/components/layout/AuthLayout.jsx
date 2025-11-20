export default function AuthLayout({ top, children, bottom }) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-transparent px-6 py-10 max-w-[393px] w-full mx-auto" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      
      {/* 상단 영역 */}
      <div className="flex flex-col items-center text-center">
        {top}
      </div>

      {/* 메인 콘텐츠(필요한 경우만 사용) */}
      <main className="flex flex-col items-center w-full">
        {children}
      </main>

      {/* 하단 영역 */}
      <div className="flex flex-col w-full gap-4 mb-6">
        {bottom}
      </div>
    </div>
  );
}
