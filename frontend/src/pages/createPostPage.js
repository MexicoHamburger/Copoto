import { useSearchParams, useNavigate } from "react-router";
import axios from 'axios';
import { useState, useEffect, useMemo, useRef } from 'react';
// import { ShieldAlert } from 'lucide-react'; // 미설치면 이 줄 주석 처리하고 이모지 사용

const BOARDS = [
  { key: "notice", label: "공지사항" },
  { key: "free",   label: "자유게시판" },
  { key: "qna",    label: "Q&A" },
];

function CreatePostPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialBoard = searchParams.get("boardType");
    const [selectedBoard, setSelectedBoard] = useState(initialBoard || "");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [boardError, setBoardError] = useState(false);
    const tabsRef = useRef(null);

    const navigate = useNavigate();
    const [showBadModal, setShowBadModal] = useState(false);

    useEffect(() => {
      const q = searchParams.get("boardType") || "";
      setSelectedBoard(q);
    }, [searchParams]);

    const handleTitleBlur = (e) => setTitle(e.target.value);
    const handleContentBlur = (e) => setContent(e.target.value);

    const handlePickBoard = (key) => {
      setSelectedBoard(key);
      setBoardError(false); // 선택하면 에러 해제
      const next = new URLSearchParams(searchParams);
      if (key) next.set("boardType", key);
      else next.delete("boardType");
      setSearchParams(next, { replace: true });
    };

    const boardLabel = useMemo(() => {
      const found = BOARDS.find(b => b.key === selectedBoard);
      return found?.label ?? "게시판 미선택";
    }, [selectedBoard]);

    const handlePost = (e) => {
        e.preventDefault();

        // ✅ BOARD 미선택 시, 절대 전송하지 않음
        if (!selectedBoard) {
          setBoardError(true);
          // 탭 영역으로 스크롤해서 사용자 시선 유도
          tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          // 간단한 흔들림 애니메이션을 주고 싶으면 아래처럼 클래스 토글도 가능
          return;
        }

        if (!title) return alert("제목을 입력해주세요.");
        if (!content) return alert("내용을 입력해주세요.");

        const postData = {
            title,
            contents: content,
            userId: window.localStorage.getItem("userid"),
            boardType: selectedBoard, // 백엔드에서도 사용 가능하도록 전달
        };

        axios.post('/api/post/create', postData)
            .then(() => navigate(`/dashboards/${selectedBoard}`))
            .catch(error => {
                if (axios.isAxiosError(error) && error.response?.status === 403) {
                    setShowBadModal(true);
                    return;
                }
                console.log('something is wrong! umm.. this should not happen..');
            });
    };

    const canSubmit = !!selectedBoard && !!title && !!content;

    return (
        <div className="pt-[30px]">
            <h1 className="text-3xl mb-4">게시글 작성</h1>

            {/* 🔷 혐오표현 탐지 안내문구 */}
            <div className="flex items-center bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-3 mb-3 shadow-sm">
                {/* <ShieldAlert className="w-5 h-5 mr-2 text-blue-600" /> */}
                <span className="mr-2">⚠️</span>
                <p className="text-sm font-medium">
                    혐오표현 탐지 AI가 작동 중입니다. 부적절한 표현이 감지될 경우 게시글/댓글 게시가 제한됩니다.
                </p>
            </div>

            {/* 🧭 게시판 선택 탭 */}
            <div className="mb-5" ref={tabsRef}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">작성 위치</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border bg-gray-50 ${boardError ? "text-red-600 border-red-300" : "text-gray-600"}`}>
                  {boardLabel}
                </span>
              </div>

              <div
                className={
                  "flex gap-2 p-1 rounded-2xl border " +
                  (boardError
                    ? "bg-red-50 border-red-300"
                    : "bg-gray-100/70 border-gray-200")
                }
                aria-invalid={boardError ? "true" : "false"}
                aria-describedby={boardError ? "board-error-text" : undefined}
              >
                {BOARDS.map(({ key, label }) => {
                  const active = selectedBoard === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handlePickBoard(key)}
                      className={
                        "flex-1 text-sm font-semibold px-4 py-2 rounded-2xl transition " +
                        (active
                          ? "bg-white text-blue-600 shadow-sm border border-blue-200"
                          : "text-gray-600 hover:bg-white/70 hover:text-gray-800")
                      }
                      aria-pressed={active}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {boardError && (
                <p id="board-error-text" className="mt-1 text-xs text-red-600">
                  게시판을 선택해주세요.
                </p>
              )}
            </div>

            <div className="flex">
                <div id="post_writing_div" className="w-1/2 pr-5">
                    <input
                        id="title_writing_input"
                        type="text"
                        placeholder="제목을 입력해주세요."
                        className="w-full h-10 border border-gray-300 rounded-lg mt-5 p-3"
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleTitleBlur}
                    />
                    <textarea
                        id="content_writing_textarea"
                        placeholder="내용을 입력해주세요."
                        className="w-full h-[500px] border border-gray-300 rounded-lg mt-3 p-3 resize-none"
                        onChange={(e) => setContent(e.target.value)}
                        onBlur={handleContentBlur}
                    />
                </div>
                <div id="post_showing_div" className="flex-1 pl-5">
                    <div className="w-full h-10 border border-gray-300 rounded-lg mt-5 p-3 flex items-center">
                        {title}
                    </div>
                    <div className="w-full h-[500px] border border-gray-300 rounded-lg mt-3 p-3 whitespace-pre-wrap">
                        {content}
                    </div>
                </div>
            </div>

            <div id="buttons" className="flex">
                <button
                    onClick={() => {}}
                    className="mt-5 mr-5 p-2 pl-4 pr-4 bg-gray-200 text-blue-500 text-xs font-bold rounded-lg hover:bg-gray-300"
                >
                    게시글 임시저장 (미구현)
                </button>
                <button
                    onClick={() => {}}
                    className="mt-5 p-2 pl-4 pr-4 bg-gray-200 text-blue-500 text-xs font-bold rounded-lg hover:bg-gray-300"
                >
                    임시저장 게시글 불러오기 (미구현)
                </button>
                <button
                    onClick={handlePost}
                    disabled={!canSubmit}
                    className={
                      "mt-5 ml-auto p-2 pl-4 pr-4 text-white text-xs font-bold rounded-lg " +
                      (canSubmit
                        ? "bg-blue-500 hover:bg-blue-600"
                        : "bg-blue-300 cursor-not-allowed")
                    }
                    aria-disabled={!canSubmit}
                >
                    게시글 작성
                </button>
            </div>

            {showBadModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-lg">
                        <h2 className="text-lg font-bold mb-3">알림</h2>
                        <p className="text-sm text-gray-700 mb-5">
                            부적절한 표현이 감지되었습니다.
                        </p>
                        <div className="text-right">
                            <button
                                onClick={() => setShowBadModal(false)}
                                className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CreatePostPage;
