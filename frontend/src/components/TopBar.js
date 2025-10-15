import { useEffect, useState } from "react";
import CopotoLogo from "../images/copotoLogo.png";
import { useNavigate, Outlet, useLocation } from "react-router";

const BOARD_REGEX = /^\/dashboards\/([^\/\?]+)/;
const extractBoard = (pathname) => {
    const m = pathname.match(BOARD_REGEX);
    return m ? m[1] : null;
};

function TopBar() {
    const [hasToken, setHasToken] = useState(false);
    const [currentBoard, setCurrentBoard] = useState(null);
    const [query, setQuery] = useState("");               // ✅ 검색어 상태
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        try {
            window.localStorage.clear();
            setHasToken(false);
            if (typeof window.location.reload === "function") {
                window.location.reload();
            } else {
                navigate(0);
            }
        } catch {
            window.location.href = "/";
        }
    };

    // ✅ 검색 실행
    const runSearch = () => {
        const q = query.trim();
        if (!q) return;
        // 현재 보드와 함께 저장해두면 결과에서 필터 가능
        window.localStorage.setItem("searchKeyword", q);
        window.localStorage.setItem("searchBoard", currentBoard || "main");
        navigate(`/search?q=${encodeURIComponent(q)}`);
    };

    useEffect(() => {
        const tokenExists = !!window.localStorage.getItem("token");
        setHasToken(tokenExists);
    }, []);

    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === "token") setHasToken(!!e.newValue);
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    useEffect(() => {
        const board = extractBoard(location.pathname);
        setCurrentBoard(board);
        window.localStorage.setItem("currentBoard", board ?? "main");
    }, [location.pathname]);

    const tabClass = (name) =>
        `w-auto px-4 h-auto py-2 rounded-3xl cursor-pointer transition ${currentBoard === name ? "bg-blue-500 text-white" : "hover:bg-gray-200"
        }`;

    return (
        <>
            <header className="border-b flex fixed top-0 left-0 w-full bg-white z-50">
                <div className="pl-[10%]">
                    <img
                        src={CopotoLogo}
                        alt="Copoto Logo"
                        className="max-w-[150px] p-4 cursor-pointer"
                        onClick={() => navigate("/")}
                    />
                </div>

                <div className="w-[15%] flex items-center justify-center text-xl font-bold">
                    <div className={tabClass("notice")} onClick={() => navigate("/dashboards/notice")}>
                        공지사항
                    </div>
                </div>
                <div className="w-[15%] flex items-center justify-center text-xl font-bold">
                    <div className={tabClass("free")} onClick={() => navigate("/dashboards/free")}>
                        자유게시판
                    </div>
                </div>
                <div className="w-[15%] flex items-center justify-center text-xl font-bold">
                    <div className={tabClass("qna")} onClick={() => navigate("/dashboards/qna")}>
                        Q&A
                    </div>
                </div>

                <div className="w-[22%] my-5">
                    <div className="flex items-center border border-gray-300 rounded-full px-2 shadow-sm overflow-hidden">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="flex-1 h-9 px-2 outline-none text-gray-700 placeholder-gray-400"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && runSearch()}
                        />
                        <button
                            onClick={runSearch}
                            className="ml-1 h-8 px-3 rounded-full bg-blue-500 text-white text-sm font-medium
                 hover:bg-blue-600 shrink-0 whitespace-nowrap min-w-[64px] leading-none"
                            aria-label="검색"
                        >
                            검색
                        </button>
                    </div>
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
                                    navigate("/login");
                                }}
                                className="w-20 p-2 h-1/2 bg-blue-500 text-white text-xs font-bold rounded-3xl hover:bg-blue-600"
                            >
                                로그인
                            </button>
                            <button
                                onClick={() => navigate("/register")}
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
    );
}

export default TopBar;
