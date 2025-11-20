import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import { useState } from "react";

export default function SignUp() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
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

          {/* 이름 */}
          <div>
            <label className="block mb-1 text-sm font-semibold">이름</label>
            <div className="flex items-center border border-[#D9673C] rounded-xl px-4 py-3 gap-2">
              <span className="text-[#D9673C]">👤</span>
              <input
                type="text"
                className="flex-1 outline-none"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
          </div>

          {/* 가입하기 버튼 */}
          <button className="w-full py-4 bg-[#D9673C] text-white rounded-2xl text-lg font-semibold">
            가입하기
          </button>

          {/* 로그인 이동 */}
          <p className="text-center text-sm">
            이미 계정이 있으신가요?
            <span
              onClick={() => navigate("/login")}
              className="text-[#D9673C] font-semibold ml-1 cursor-pointer"
            >
              로그인
            </span>
          </p>
        </div>
      }
    />
  );
}
