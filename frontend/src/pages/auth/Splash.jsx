import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import logo from "../../assets/images/Logo.png";
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
    <AuthLayout
      top={
        <div className="flex flex-col items-center text-center">
          <p className="text-lg font-medium text-gray-700">
            <span className="font-bold">집안일 관리</span>의 업그레이드
          </p>
          <img src={logo} alt="JIPUP Logo" className="w-40 h-auto mt-2" />
        </div>
      }
      bottom={
        <div className="relative w-full flex justify-center">
          <div className="absolute bottom-0 w-full h-[300px] bg-[#D5A89F] rounded-t-full"></div>
          <img
            src={character}
            alt="character"
            className="relative z-10 w-52 h-auto mb-4"
          />
        </div>
      }
    />
  );
}
