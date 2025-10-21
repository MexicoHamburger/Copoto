import { useNavigate, useLocation } from "react-router";
import { api } from '../lib/api';
import { useState, useEffect, useMemo, useRef } from 'react';

const BOARDS = [
  { key: "notice", label: "공지사항" },
  { key: "free",   label: "자유게시판" },
  { key: "qna",    label: "Q&A" },
];

const VALID_KEYS = new Set(BOARDS.map((b) => b.key));
const normalizeBoard = (k) => (VALID_KEYS.has(k) ? k : "");

const getInitialBoard = () => {
  const fromCurrent = window.localStorage.getItem("currentBoard");
  const v = fromCurrent ?? "";
  return v === "main" ? "" : v;
};

function CreatePostPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ 모드/포스트ID 파싱
  const qs = new URLSearchParams(location.search);
  const editMode = (qs.get("mode") || "").toLowerCase() === "edit";
  const editPostId = qs.get("postId");

  const [selectedBoard, setSelectedBoard] = useState(getInitialBoard());
  const [title, setTitle] = useState(location.state?.title || "");
  const [content, setContent] = useState(location.state?.content || "");
  const [boardError, setBoardError] = useState(false);
  const [showBadModal, setShowBadModal] = useState(false);
  const [loadingFill, setLoadingFill] = useState(editMode && !location.state); // 프리필 로딩
  const tabsRef = useRef(null);

  // 🔔 임시저장 관련 상태
  const [savingTemp, setSavingTemp] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [tempList, setTempList] = useState([]);        // [{id,title,contents,createdAt,updatedAt}]
  const [deletingId, setDeletingId] = useState(null);

  // ✅ URL ?boardType= 우선 (수정 모드에서는 전달된 boardType/글 데이터가 더 우선)
  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const fromQuery = qs.get("boardType") || "";
    if (editMode) {
      const stBoard = location.state?.boardType;
      if (stBoard) setSelectedBoard(normalizeBoard(stBoard));
      else if (fromQuery) setSelectedBoard(normalizeBoard(fromQuery));
    } else {
      if (fromQuery !== null) setSelectedBoard(normalizeBoard(fromQuery));
      else setSelectedBoard((prev) => normalizeBoard(prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, editMode]);

  // 최초 마운트: 수정 모드면 글 상세에서 다시 fetch하여 프리필(상태가 없을 때)
  useEffect(() => {
    if (!editMode || !editPostId || location.state) return;

    let aborted = false;
    (async () => {
      try {
        setLoadingFill(true);
        const res = await api.get(`/post/${editPostId}`);
        const data = res?.data?.data ?? {};
        if (aborted) return;
        setTitle(data.title ?? "");
        setContent(data.contents ?? "");
        setSelectedBoard(normalizeBoard(data.type ?? ""));
      } catch (e) {
        console.error(e);
        alert("수정할 게시글을 불러오지 못했습니다.");
        navigate(`/pages/${editPostId}`);
      } finally {
        if (!aborted) setLoadingFill(false);
      }
    })();

    return () => { aborted = true; };
  }, [editMode, editPostId, location.state, navigate]);

  const handleTitleBlur = (e) => setTitle(e.target.value);
  const handleContentBlur = (e) => setContent(e.target.value);

  const handlePickBoard = (key) => {
    const normalized = normalizeBoard(key);
    setSelectedBoard(normalized);
    setBoardError(false);
    window.localStorage.setItem("dashboard", normalized);

    const qs = new URLSearchParams(location.search);
    if (normalized) qs.set("boardType", normalized);
    else qs.delete("boardType");
    if (editMode) qs.set("mode", "edit");
    if (editMode && editPostId) qs.set("postId", editPostId);
    navigate({ pathname: location.pathname, search: `?${qs.toString()}` }, { replace: true });
  };

  const boardLabel = useMemo(() => {
    const found = BOARDS.find((b) => b.key === selectedBoard);
    return found?.label ?? "게시판 미선택";
  }, [selectedBoard]);

  const isBoardValid = !!selectedBoard && selectedBoard !== "main";
  const canSubmit = isBoardValid && !!title && !!content && !loadingFill;

  // =========================
  // 임시저장 Handlers
  // =========================
  const ensureLoginOrRedirect = () => {
    const token = window.localStorage.getItem('accessToken');
    if (!token) {
      window.localStorage.setItem(
        'afterLogin',
        editMode
          ? `/createpost?mode=edit&postId=${editPostId}&boardType=${selectedBoard}`
          : `/createpost?boardType=${selectedBoard}`
      );
      navigate('/login');
      return false;
    }
    return true;
  };

  // 저장
  const handleTempSave = async () => {
    if (!ensureLoginOrRedirect()) return;
    if (!title && !content) {
      return alert("임시저장할 제목 또는 내용을 입력해주세요.");
    }
    try {
      setSavingTemp(true);
      await api.post("/temp-post/save", { title, contents: content });
      alert("임시저장 완료 (계정당 최대 10개, FIFO)");
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "임시저장 중 오류가 발생했습니다.");
    } finally {
      setSavingTemp(false);
    }
  };

  // 목록 열기 + 불러오기
  const openTempList = async () => {
    if (!ensureLoginOrRedirect()) return;
    setListOpen(true);
    setListLoading(true);
    try {
      const res = await api.get("/temp-post/list");
      setTempList(res?.data?.data ?? []);
    } catch (e) {
      console.error(e);
      alert("임시저장 목록을 불러오지 못했습니다.");
      setListOpen(false);
    } finally {
      setListLoading(false);
    }
  };

  const loadTempItem = async (id) => {
    try {
      const res = await api.get(`/temp-post/${id}`);
      const data = res?.data?.data ?? {};
      setTitle(data.title ?? "");
      setContent(data.contents ?? "");
      setListOpen(false);
      alert("임시저장 글을 불러왔습니다.");
    } catch (e) {
      console.error(e);
      alert("임시저장 글을 불러오지 못했습니다.");
    }
  };

  const deleteTempItem = async (id) => {
    if (!window.confirm("이 임시저장 글을 삭제할까요?")) return;
    try {
      setDeletingId(id);
      await api.delete(`/temp-post/${id}`);
      setTempList((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  // =========================
  // 최종 제출
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = window.localStorage.getItem('accessToken');
    if (!token) {
      window.localStorage.setItem('afterLogin',
        editMode
          ? `/createpost?mode=edit&postId=${editPostId}&boardType=${selectedBoard}`
          : `/createpost?boardType=${selectedBoard}`
      );
      navigate('/login');
      return;
    }
    if (!isBoardValid) {
      setBoardError(true);
      tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!title) return alert("제목을 입력해주세요.");
    if (!content) return alert("내용을 입력해주세요.");

    const payload = {
      title,
      contents: content,
      userId: window.localStorage.getItem("userid"),
      type: selectedBoard,
    };

    try {
      if (editMode) {
        await api.put(`/post/${editPostId}`, payload);
        navigate(`/pages/${editPostId}`);
      } else {
        const res = await api.post('/post/create', payload);
        const newId = res?.data?.data?.postId;
        if (newId) navigate(`/pages/${newId}`);
        else navigate(`/dashboards/${selectedBoard}`);
      }
    } catch (error) {
      if (!editMode && error.response?.status === 403) {
        setShowBadModal(true);
        return;
      }
      console.log(error);
      alert(editMode ? "게시글 수정 중 오류가 발생했습니다." : "게시글 작성 중 오류가 발생했습니다.");
    }
  };

  // =========================
  // Render
  // =========================
  return (
    <div className="pt-[30px]">
      <h1 className="text-3xl mb-4">{editMode ? "게시글 수정" : "게시글 작성"}</h1>

      {/* 안내 */}
      <div className="flex items-center bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-3 mb-3 shadow-sm">
        <span className="mr-2">⚠️</span>
        <p className="text-sm font-medium">
          혐오표현 탐지 AI가 작동 중입니다. 부적절한 표현이 감지될 경우 게시글/댓글 게시가 제한됩니다.
        </p>
      </div>

      {/* 게시판 선택 */}
      <div className="mb-5" ref={tabsRef}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">작성 위치</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border bg-gray-50 ${boardError ? "text-red-600 border-red-300" : "text-gray-600"}`}>
            {boardLabel}{editMode && " · (수정 중)"}
          </span>
        </div>

        <div
          className={
            "flex gap-2 p-1 rounded-2xl border " +
            (boardError ? "bg-red-50 border-red-300" : "bg-gray-100/70 border-gray-200")
          }
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
                    ? "bg-white text-blue-600 shadow-sm border border-blue-200 ring-1 ring-blue-200"
                    : "text-gray-600 hover:bg-white/70 hover:text-gray-800 hover:shadow-sm")
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

      {/* 에디터 좌/우 프리뷰 */}
      <form onSubmit={handleSubmit}>
        <div className="flex">
          <div id="post_writing_div" className="w-1/2 pr-5">
            <input
              id="title_writing_input"
              type="text"
              placeholder="제목을 입력해주세요."
              className="w-full h-10 border border-gray-300 rounded-lg mt-5 p-3 disabled:bg-gray-50"
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              value={title}
              disabled={loadingFill}
            />
            <textarea
              id="content_writing_textarea"
              placeholder="내용을 입력해주세요."
              className="w-full h-[500px] border border-gray-300 rounded-lg mt-3 p-3 resize-none disabled:bg-gray-50"
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleContentBlur}
              value={content}
              disabled={loadingFill}
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
          {!editMode && (
            <>
              <button
                type="button"
                onClick={handleTempSave}
                disabled={savingTemp}
                className={
                  "mt-5 mr-5 p-2 pl-4 pr-4 text-xs font-bold rounded-lg " +
                  (savingTemp
                    ? "bg-gray-300 text-gray-600 cursor-wait"
                    : "bg-gray-200 text-blue-500 hover:bg-gray-300")
                }
              >
                {savingTemp ? "임시저장 중..." : "게시글 임시저장"}
              </button>

              <button
                type="button"
                onClick={openTempList}
                className="mt-5 p-2 pl-4 pr-4 bg-gray-200 text-blue-500 text-xs font-bold rounded-lg hover:bg-gray-300"
              >
                임시저장 게시글 불러오기
              </button>
            </>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={
              "mt-5 ml-auto p-2 pl-4 pr-4 text-white text-xs font-bold rounded-lg " +
              (canSubmit ? "bg-blue-500 hover:bg-blue-600" : "bg-blue-300 cursor-not-allowed")
            }
            aria-disabled={!canSubmit}
          >
            {editMode ? "수정 완료" : "게시글 작성"}
          </button>
        </div>
      </form>

      {/* 혐오표현 차단 안내 모달 */}
      {showBadModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w/full max-w-sm shadow-lg">
            <h2 className="text-lg font-bold mb-3">알림</h2>
            <p className="text-sm text-gray-700 mb-5">부적절한 표현이 감지되었습니다.</p>
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

      {/* 임시저장 목록 모달 */}
      {listOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">임시저장 목록</h2>
              <button
                onClick={() => setListOpen(false)}
                className="text-sm px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                닫기
              </button>
            </div>

            {listLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : tempList.length === 0 ? (
              <div className="text-gray-600 text-sm">임시저장된 글이 없습니다.</div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-auto">
                {tempList.map((it) => (
                  <div key={it.id} className="p-3 rounded-xl border flex items-start gap-3">
                    <div className="flex-1">
                      <div className="font-medium line-clamp-1">{it.title || "(제목 없음)"}</div>
                      <div className="text-xs text-gray-600 line-clamp-2 whitespace-pre-wrap">
                        {it.contents}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-1">
                        {it.updatedAt || it.createdAt}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadTempItem(it.id)}
                        className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs hover:bg-blue-700"
                      >
                        불러오기
                      </button>
                      <button
                        onClick={() => deleteTempItem(it.id)}
                        disabled={deletingId === it.id}
                        className={
                          "px-3 py-2 rounded-lg text-xs " +
                          (deletingId === it.id
                            ? "bg-gray-300 text-gray-600 cursor-wait"
                            : "bg-gray-100 hover:bg-gray-200")
                        }
                      >
                        {deletingId === it.id ? "삭제 중..." : "삭제"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CreatePostPage;
