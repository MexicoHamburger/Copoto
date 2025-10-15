import { useEffect, useState } from "react";
import CopotoLogo from "../images/copotoLogo.png";
import { useNavigate, Outlet, useLocation } from "react-router";
import { api } from "../lib/api";

const BOARD_REGEX = /^\/dashboards\/([^\/\?]+)/;
const extractBoard = (pathname) => {
    const m = pathname.match(BOARD_REGEX);
    return m ? m[1] : null;
};

function TopBar() {
    const [hasToken, setHasToken] = useState(false);
    const [currentBoard, setCurrentBoard] = useState(null);
    const [query, setQuery] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

    const refreshHasToken = () => {
        const token = window.localStorage.getItem("accessToken");
        setHasToken(!!token);
    }

    const handleLogout = async () => {
        try {
            await api.post("/user/logout", null);
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
        refreshHasToken();
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

    const tabClass = (name) => {
        const isActive = currentBoard === name;
        return [
            "px-5 py-2 rounded-xl border text-base font-semibold transition",
            "cursor-pointer select-none",
            "shadow-[0_0_0_0_rgba(0,0,0,0)] hover:shadow-sm",   // hover 시 살짝 그림자
            "transform hover:-translate-y-[1px]",               // 살짝 떠오르는 효과
            isActive
                ? "bg-blue-50 text-blue-700 border-blue-400"
                : "bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300",
            "focus:outline-none focus:ring-2 focus:ring-blue-200"
        ].join(" ");
    };

    return (
        <>
            <header className="border-b fixed py-3 left-0 w-full bg-white z-50">
                {/* 안쪽 컨테이너 */}
                <div className="mx-auto w-full max-w-[1200px] px-6 py-1
                  flex items-center gap-4 justify-between">
                    {/* 왼쪽: 로고 */}
                    <button onClick={() => navigate("/")} className="flex items-center gap-2">
                        <img src={CopotoLogo} alt="Copoto Logo" className="h-10 w-auto" />
                        {/* 선택: 텍스트 로고가 있다면 여기에 */}
                    </button>

                    {/* 가운데: 탭 + 검색 */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* 탭 그룹 */}
                        <nav className="flex items-center gap-4 flex-none">
                            <button
                                role="tab"
                                aria-selected={currentBoard === "notice"}
                                className={tabClass("notice")}
                                onClick={() => navigate("/dashboards/notice")}
                            >
                                공지사항
                            </button>
                            <button
                                role="tab"
                                aria-selected={currentBoard === "free"}
                                className={tabClass("free")}
                                onClick={() => navigate("/dashboards/free")}
                            >
                                자유게시판
                            </button>
                            <button
                                role="tab"
                                aria-selected={currentBoard === "qna"}
                                className={tabClass("qna")}
                                onClick={() => navigate("/dashboards/qna")}
                            >
                                Q&A
                            </button>
                        </nav>

                        <div className="flex-1 min-w-[320px] max-w-[420px]">
                            <div className="flex items-center border border-gray-300 rounded-full px-2 py-1 shadow-sm overflow-hidden">
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
                                >
                                    검색
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 오른쪽: 로그인/로그아웃/프로필 */}
                    <div className="flex items-center gap-2 flex-none">
                        {hasToken ? (
                            <>
                                <button
                                    onClick={handleLogout}
                                    className="px-3 py-2 rounded-full bg-gray-100 text-blue-600 text-xs font-bold hover:bg-gray-200"
                                >
                                    로그아웃
                                </button>
                                <button
                                    onClick={() => navigate("/profile")}
                                    className="px-3 py-2 rounded-full bg-blue-500 text-white text-xs font-bold hover:bg-blue-600"
                                >
                                    마이페이지
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
                                    className="px-3 py-2 rounded-full bg-blue-500 text-white text-xs font-bold hover:bg-blue-600"
                                >
                                    로그인
                                </button>
                                <button
                                    onClick={() => navigate("/register")}
                                    className="px-3 py-2 rounded-full bg-gray-100 text-blue-600 text-xs font-bold hover:bg-gray-200"
                                >
                                    회원가입
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <div className="pt-[70px] pl-[20%] pr-[20%]">
                <Outlet />
            </div>
        </>
    );
}

export default TopBar;
