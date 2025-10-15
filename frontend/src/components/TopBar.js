import { useEffect, useState } from "react";
import CopotoLogo from "../images/copotoLogo.png";
import { useNavigate, Outlet, useLocation } from "react-router";

// URL에서 /dashboards/:boardName 형태를 추출
const BOARD_REGEX = /^\/dashboards\/([^\/\?]+)/;
const extractBoard = (pathname) => {
  const m = pathname.match(BOARD_REGEX);
  return m ? m[1] : null; // null이면 메인 화면 등
};

function TopBar() {
  const [hasToken, setHasToken] = useState(false);
  const [currentBoard, setCurrentBoard] = useState(null); // "notice" | "free" | "qna" | null
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    window.localStorage.clear();
    setHasToken(false);
    // 로그아웃 시 현재 위치는 유지하거나, 필요하면 아래 주석 해제해 초기화
    // setCurrentBoard(null);
    // window.localStorage.removeItem("currentBoard");
  };

  // 최초 토큰 상태 확인
  useEffect(() => {
    const tokenExists = !!window.localStorage.getItem("token");
    setHasToken(tokenExists);
  }, []);

  // 라우트 변경 시 현재 게시판 갱신 + localStorage에 저장
  useEffect(() => {
    const board = extractBoard(location.pathname);
    setCurrentBoard(board);
    if (board) {
      window.localStorage.setItem("currentBoard", board);
    } else {
      // 대시보드 외 경로(메인 등)에서는 "main"으로 저장하거나 제거 중 택1
      window.localStorage.setItem("currentBoard", "main");
      // 또는 제거하고 싶으면:
      // window.localStorage.removeItem("currentBoard");
    }
  }, [location.pathname]);

  // 어디서든 마지막 위치를 확인하고 싶을 때:
  // const lastBoard = window.localStorage.getItem("currentBoard"); // "notice"|"free"|"qna"|"main"

  // 활성 탭 스타일 헬퍼
  const tabClass = (name) =>
    `w-auto px-4 h-auto py-2 rounded-3xl cursor-pointer transition ${
      currentBoard === name
        ? "bg-blue-500 text-white"
        : "hover:bg-gray-200"
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
