import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import { useState } from "react";
import googleLogo from "../../assets/images/Google-Logo.png";
import api from "../../utils/axios";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const data = res.data;

      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      setLoading(false);
      navigate('/main');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('로그인에 실패했습니다.');
      }
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      top={
        <div className="w-full flex justify-start">
          <button onClick={() => navigate(-1)} className="text-3xl mb-4">
            ←
          </button>
        </div>
      }
      bottom={
        <div className="flex flex-col w-full gap-6">
          {/* 이메일 */}
          <div>
            <label className="block mb-1 text-sm font-semibold text-left w-full">이메일</label>
            <div className="flex items-center border border-[#D9673C] bg-[#E7E9EB] rounded-xl px-4 py-3 gap-2">
              <span className="text-[#D9673C]">@</span>
              <input
                type="email"
                className="flex-1 outline-none bg-transparent text-[#D9673C]"
                placeholder="abc@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
              />
            </div>
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block mb-1 text-sm font-semibold text-left w-full">비밀번호</label>
            <div className="flex items-center border border-[#D9673C] bg-[#E7E9EB] rounded-xl px-4 py-3 gap-2">
              <span className="text-[#D9673C]">🔒</span>
              <input
                type="password"
                className="flex-1 outline-none bg-transparent text-[#D9673C]"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
              />
            </div>

            <p className="text-xs text-[#D9673C] mt-1 w-full text-right">
              아이디/비밀번호 찾기
            </p>
          </div>

          {/* Login 버튼 */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full h-[50px] ${loading ? 'opacity-60' : ''} bg-[#D9673C] text-white rounded-xl text-lg font-semibold flex items-center justify-center`}
          >
            {loading ? '로딩...' : '로그인'}
          </button>

          {/* 에러 */}
          {error && <p className="text-center text-sm text-red-500">{error}</p>}

         {/* 구글 로그인 */}
          <div>
            <div className="w-full h-[50px] flex items-center border border-[#D9673C] rounded-xl px-4 gap-2 justify-center bg-[#E7E9EB]">
              <img
                src={googleLogo}
                alt="google"
                className="w-5 h-5"
              />
              <span className="text-sm text-[#D9673C]">구글 계정으로 가입하기</span>
            </div>
          </div>

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
