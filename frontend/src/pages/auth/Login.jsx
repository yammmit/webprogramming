import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import { useState } from "react";
import api from "../../api/axiosInstance";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const token = res.data.token;
      const user = res.data.user;
      if (token) localStorage.setItem('access_token', token);
      if (user) localStorage.setItem('user', JSON.stringify(user));
      navigate('/main/dashboard');
    } catch (err) {
      console.error(err);
      const serverMsg = err.response?.data?.error || err.response?.data?.message || '';
      const genericMsg = '로그인에 실패했습니다.';
      const credentialPattern = /invalid credential|invalid credentials|비밀번호|password|wrong|회원정보|존재하지|등록된 회원|회원이 없습니다|user not found|not found/i;
      const isCredIssue = err.response?.status === 401 || err.response?.status === 404 || credentialPattern.test(String(serverMsg));
      if (isCredIssue) {
        setError('회원정보를 확인하세요');
      } else {
        setError(serverMsg || genericMsg);
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
        <form onSubmit={handleLogin} className="flex flex-col w-full gap-6">
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

          {/* 에러 */}
          {error && <p className="text-center text-sm text-red-500">{error}</p>}

          {/* Login 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full h-[50px] ${loading ? 'opacity-60' : ''} bg-[#D9673C] text-white rounded-xl text-lg font-semibold flex items-center justify-center`}
          >
            {loading ? '로딩...' : '로그인'}
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
        </form>
      }
    />
  );
}
