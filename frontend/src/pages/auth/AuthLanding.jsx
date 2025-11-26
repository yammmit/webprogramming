import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import logo from "../../assets/images/Logo.png";

export default function AuthLanding() {
	const navigate = useNavigate();

	return (
		<AuthLayout
			top={
				<div className="flex flex-col items-center mt-12">
					<p className="text-lg font-medium text-gray-700">
						<span className="font-bold">집안일 관리</span>의 업그레이드
					</p>
					<img src={logo} alt="JIPUP Logo" className="w-40 h-auto mt-2" />
				</div>
			}
			bottom={
				<>
					<button
						onClick={() => navigate("/login")}
						className="w-full py-4 bg-[#DF6437] text-white rounded-2xl text-lg font-semibold"
					>
						로그인
					</button>

					<button
						onClick={() => navigate("/signup")}
						className="w-full py-4 bg-[#5C676A] text-white rounded-2xl text-lg font-semibold"
					>
						회원가입
					</button>
				</>
			}
		/>
	);
}
