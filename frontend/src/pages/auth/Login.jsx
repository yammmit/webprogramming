import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import { useState } from "react";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <AuthLayout
      top={
        <button onClick={() => navigate(-1)} className="text-3xl mb-4">
          ←
        </button>
      }
      bottom={
        <div className="flex flex-col w-full gap-6">
          {/* 이메일 */}
          <div>
            <label className="block mb-1 text-sm font-semibold">이메일</label>
            <div className="flex items-center border border-[#D9673C] rounded-xl px-4 py-3 gap-2">
              <span className="text-[#D9673C]">@</span>
              <input
                type="email"
                className="flex-1 outline-none"
                placeholder="abc@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block mb-1 text-sm font-semibold">비밀번호</label>
            <div className="flex items-center border border-[#D9673C] rounded-xl px-4 py-3 gap-2">
              <span className="text-[#D9673C]">🔒</span>
              <input
                type="password"
                className="flex-1 outline-none"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <p className="text-right text-xs text-[#D9673C] mt-1">
              아이디/비밀번호 찾기
            </p>
          </div>

          {/* Login 버튼 */}
          <button className="w-full py-4 bg-[#D9673C] text-white rounded-2xl text-lg font-semibold">
            Login
          </button>

          {/* 구글 로그인 */}
          <button className="w-full py-3 border border-[#D9673C] rounded-2xl text-[#D9673C] flex items-center justify-center gap-2 text-sm">
            <img
              src="/google-icon.svg"
              alt="google"
              className="w-5 h-5"
            />
            구글 계정으로 가입하기
          </button>

          {/* 회원가입 이동 */}
          <p className="text-center text-sm">
            계정이 없으신가요?
            <span
              onClick={() => navigate("/signup")}
              className="text-[#D9673C] font-semibold ml-1 cursor-pointer"
            >
              가입하기
            </span>
          </p>
        </div>
      }
    />
  );
}
