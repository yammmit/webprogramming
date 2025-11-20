import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import character from "../../assets/images/splash-character.png";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/auth");
    }, 1800); // 1.8초 후 자동 이동

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-[#E5ECEF]">
      
      {/* 상단 여백 */}
      <div className="mt-10"></div>

      {/* 중앙 텍스트 + 로고 */}
      <div className="flex flex-col items-center text-center">
        <p className="text-lg font-medium text-gray-700">
          <span className="font-bold">집안일 관리</span>의 업그레이드
        </p>
        <h1 className="text-6xl font-extrabold text-[#E4552D] mt-2">
          JIPUP
        </h1>
      </div>

      {/* 하단 이미지 + 배경 반원 */}
      <div className="relative w-full flex justify-center">
        {/* 반원 배경 */}
        <div className="absolute bottom-0 w-full h-[300px] bg-[#D5A89F] rounded-t-full"></div>

        {/* 캐릭터 이미지 (로컬 파일 기준) */}
        <img
          src={character}
          alt="character"
          className="relative z-10 w-52 h-auto mb-4"
        />
      </div>
    </div>
  );
}
