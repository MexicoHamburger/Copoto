import { useEffect, useState } from "react";
import CopotoLogo from "../images/copotoLogo.png";
import { useNavigate, Outlet, useLocation } from "react-router";

function TopBar() {
    const [hasToken, setHasToken] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const handleLogout = () => {
        window.localStorage.clear();
        setHasToken(false);
    };

    useEffect(() => {
        const tokenExists = !!window.localStorage.getItem("token");
        setHasToken(tokenExists);
    }, []);

    return (
        <>
            <header className="border-b flex fixed top-0 left-0 w-full bg-white z-50">
                <div className="pl-[10%]">
                    <img src={CopotoLogo} alt="Copoto Logo"
                        className="max-w-[150px] p-4 cursor-pointer"
                        onClick={() => navigate("/")} />
                </div>
                <div className="w-[15%] flex items-center justify-center text-xl font-bold">
                    <div className="w-auto px-4 h-auto py-2 rounded-3xl hover:bg-gray-200 cursor-pointer"
                        onClick={() => navigate("/dashboards/notice")}>
                        공지사항
                    </div>
                </div>
                <div className="w-[15%] flex items-center justify-center text-xl font-bold">
                    <div className="w-auto px-4 h-auto py-2 rounded-3xl hover:bg-gray-200 cursor-pointer"
                        onClick={() => navigate("/dashboards/free")}>
                        자유게시판
                    </div>
                </div>
                <div className="w-[15%] flex items-center justify-center text-xl font-bold">
                    <div className="w-auto px-4 h-auto py-2 rounded-3xl hover:bg-gray-200 cursor-pointer"
                        onClick={() => navigate("/dashboards/qna")}>
                        Q&A
                    </div>
                </div>
                <div className="w-[15%] flex items-center border border-gray-300 rounded-3xl px-4 my-3 shadow-sm">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="outline-none w-full text-gray-700 placeholder-gray-400"
                    />
                </div>
                <div className="ml-[2%] w-[20%] flex items-center">
                    {hasToken ? (
                        <>
                            <button
                                onClick={handleLogout}
                                className="w-20 ml-5 p-2 h-1/2 bg-gray-200 text-blue-500 text-xs font-bold rounded-3xl hover:bg-gray-300"
                            >
                                로그아웃
                            </button>
                            <button
                                onClick={() => navigate("/profile")}
                                className="w-30 ml-5 p-2 h-1/2 bg-blue-500 text-white text-xs font-bold rounded-3xl hover:bg-blue-600"
                            >
                                회원 정보 보기
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    const currentPage = location.pathname + location.search;
                                    window.localStorage.setItem("afterLogin", currentPage);
                                    navigate('/login')
                                }}
                                className="w-20 p-2 h-1/2 bg-blue-500 text-white text-xs font-bold rounded-3xl hover:bg-blue-600"
                            >
                                로그인
                            </button>
                            <button
                                onClick={() => navigate('/register')}
                                className="w-20 ml-5 p-2 h-1/2 bg-gray-200 text-blue-500 text-xs font-bold rounded-3xl hover:bg-gray-300"
                            >
                                회원가입
                            </button>
                        </>
                    )}
                </div>
            </header>
            <div className="pt-[75px] pl-[10%] pr-[10%]">
                <Outlet />
            </div>
        </>
    )
}

export default TopBar;