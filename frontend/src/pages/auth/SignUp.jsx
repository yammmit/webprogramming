import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import { useState } from "react";
import api from "../../utils/axios";

export default function SignUp() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSignup() {
    setError("");
    setSuccess("");
    if (!email || !name || !password) {
      setError("모든 항목을 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/signup', { email, password, name });
      const data = res.data;

      if (data && data.user_id) {
        setSuccess('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
        setTimeout(() => navigate('/login'), 1000);
      } else {
        setError((data && data.message) || '회원가입 실패');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('서버와 통신 중 오류가 발생했습니다.');
      }
    } finally {
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
                onKeyDown={(e) => { if (e.key === 'Enter') handleSignup(); }}
              />
            </div>
          </div>

          {/* 이름 */}
          <div>
            <label className="block mb-1 text-sm font-semibold text-left w-full">이름</label>
            <div className="flex items-center border border-[#D9673C] bg-[#E7E9EB] rounded-xl px-4 py-3 gap-2">
              <span className="text-[#D9673C]">👤</span>
              <input
                type="text"
                className="flex-1 outline-none bg-transparent text-[#D9673C]"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSignup(); }}
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
                onKeyDown={(e) => { if (e.key === 'Enter') handleSignup(); }}
              />
            </div>
          </div>

          {/* 에러/성공 메시지 */}
          {error && <p className="text-center text-sm text-red-500">{error}</p>}
          {success && <p className="text-center text-sm text-green-600">{success}</p>}

          {/* 가입하기 버튼 */}
          <button
            onClick={handleSignup}
            disabled={loading}
            className={`w-full h-[50px] ${loading ? 'opacity-60' : ''} bg-[#D9673C] text-white rounded-xl text-lg font-semibold flex items-center justify-center`}
          >
            {loading ? '로딩...' : '가입하기'}
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
