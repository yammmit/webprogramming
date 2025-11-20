import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";

export default function AuthLanding() {
	const navigate = useNavigate();

	return (
		<div className="min-h-screen" style={{ backgroundColor: "#D7DBDC" }}>
			<AuthLayout
				top={
					<div className="flex flex-col items-center mt-12">
						<p className="text-lg font-medium text-gray-700">
							<span className="font-bold">집안일 관리</span>의 업그레이드
						</p>
						<h1 className="text-6xl font-extrabold text-[#F15A24] mt-2">
							JIPUP
						</h1>
					</div>
				}
				bottom={
					<>
						{/* 로그인 버튼 */}
						<button
							onClick={() => navigate("/login")}
							className="w-full py-4 bg-[#DF6437] text-white rounded-2xl text-lg font-semibold"
						>
							로그인
						</button>

						{/* 회원가입 버튼 */}
						<button
							onClick={() => navigate("/signup")}
							className="w-full py-4 bg-[#5C676A] text-white rounded-2xl text-lg font-semibold"
						>
							회원가입
						</button>
					</>
				}
			/>
		</div>
	);
}
