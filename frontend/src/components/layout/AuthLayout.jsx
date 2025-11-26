export default function AuthLayout({ top, children, bottom }) {
  return (
    <div
      className="
        min-h-[100dvh]  
        flex flex-col justify-between
        bg-[#E7E9EB]
        px-6 py-10
        mx-auto
        w-full
        max-w-[480px]      /* 모바일+태블릿 수준 */
        lg:max-w-[744px]  /* 더 넓은 브레이크포인트 */
      "
    >
      <div className="flex flex-col items-center text-center mb-6">
        {top}
      </div>

      <main className="flex flex-col items-center w-full gap-4">
        {children}
      </main>

      <div className="flex flex-col w-full gap-4 mb-6">
        {bottom}
      </div>
    </div>
  );
}
