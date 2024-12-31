import CopotoLogo from "../images/copotoLogo.png"
import { useNavigate } from "react-router-dom";

function TopBar() {
    const navigate = useNavigate();
    const gotoLoginPage = () => {
        navigate('/login');
    }
    const gotoRegisterPage = () => {
        navigate('/register');
    }

    return (
        <header className = "border-b flex">
            <div className = "pl-[10%]">
                <img src={CopotoLogo} alt = "Copoto Logo"
                className = "max-w-[150px] p-4"/>
            </div>
            <div className = "w-[15%] flex items-center justify-center text-xl font-bold">
                <div className = "w-auto px-4 h-auto py-2 rounded-3xl hover:bg-gray-200">
                    공지사항
                </div>
            </div>
            <div className = "w-[15%] flex items-center justify-center text-xl font-bold">
                <div className = "w-auto px-4 h-auto py-2 rounded-3xl hover:bg-gray-200">
                    자유게시판
                </div>
            </div>
            <div className = "w-[15%] flex items-center justify-center text-xl font-bold">
                <div className = "w-auto px-4 h-auto py-2 rounded-3xl hover:bg-gray-200">
                    Q&A
                </div>
            </div>
            <div class="w-[15%] flex items-center border border-gray-300 rounded-3xl px-4 my-3 shadow-sm">
                <input
                    type="text"
                    placeholder="Search..."
                    className="outline-none w-full text-gray-700 placeholder-gray-400"
                />
            </div>
            <div className="ml-[2%] w-[10%] flex items-center">
                <button
                    onClick={gotoLoginPage}
                    className="w-20 p-2 h-1/2 bg-blue-500 text-white text-xs font-bold rounded-3xl hover:bg-blue-600"
                >
                    로그인
                </button>
                <button
                    onClick={gotoRegisterPage}
                    className="w-20 ml-5 p-2 h-1/2 bg-gray-200 text-blue-500 text-xs font-bold rounded-3xl hover:bg-gray-300"
                >
                    회원가입
                </button>
            </div>
        </header>
    )
}

export default TopBar;