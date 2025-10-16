import { useParams, useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import parseDate from "../util/parseDate";
import CommentsSection from "../components/CommentsSection";

function ViewPostPage() {
  const [title, setTitle] = useState("");
  const [contents, setContents] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [nickname, setNickname] = useState("");
  const [views, setViews] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [type, setType] = useState(""); // 게시판 타입
  const params = useParams();
  const navigate = useNavigate();

  // 삭제 팝업 상태
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState("");

  const fetchedRef = useRef(false);

  useEffect(() => { fetchedRef.current = false; }, [params.pageId]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const controller = new AbortController();
    api.get(`/post/${params.pageId}`, { signal: controller.signal })
      .then(async (response) => {
        const data = response.data?.data ?? {};
        setTitle(data.title ?? "");
        setContents(data.contents ?? "");
        setCreatedAt(parseDate(data.createdAt));
        setViews(data.viewCount ?? "");
        setAuthorId(data.userId ?? "");
        setType(data.type ?? "");

        const userId = data.userId ?? "";
        if (userId) {
          try {
            const profileRes = await api.get(`/user/profile/${encodeURIComponent(userId)}`);
            const nick = profileRes?.data?.data?.nickname ?? userId;
            setNickname(nick);
          } catch {
            setNickname(userId);
          }
        } else {
          setNickname("알 수 없음");
        }
      })
      .catch((error) => {
        if (error.name === "CanceledError") return;
        console.error(error);
        navigate("/404");
      });

    return () => controller.abort();
  }, [params.pageId, navigate]);

  const myUserId = window.localStorage.getItem("userid") || "";
  const isAuthor = !!authorId && !!myUserId && authorId === myUserId;

  // 수정 이동
  const goEdit = () => {
    navigate(
      `/createpost?mode=edit&postId=${params.pageId}${type ? `&boardType=${encodeURIComponent(type)}` : ""}`,
      { state: { title, content: contents, boardType: type } }
    );
  };

  // 삭제 팝업 열기/닫기
  const openDelete = () => { setDeleteErr(""); setConfirmOpen(true); };
  const closeDelete = () => { setConfirmOpen(false); setDeleteErr(""); setDeleting(false); };

  // 삭제 실행
  const submitDelete = async () => {
    try {
      setDeleting(true);
      setDeleteErr("");
      await api.delete(`/post/${params.pageId}`);
      // 삭제 성공 → 해당 게시판 목록으로
      if (type) navigate(`/dashboards/${type}`);
      else navigate(`/`);
    } catch (e) {
      const s = e?.response?.status;
      const msg =
        s === 401 ? "로그인이 필요합니다."
        : s === 403 ? "이 게시글을 삭제할 권한이 없습니다."
        : s === 404 ? "게시글을 찾을 수 없습니다."
        : "게시글 삭제 중 오류가 발생했습니다.";
      setDeleteErr(msg);
      setDeleting(false);
    }
  };

  return (
    <div className="pt-[30px]">
      <div className="flex justify-between border-t-2 border-b-2 border-gray-300 bg-gray-200 p-[10px]">
        <h1 className="text-3xl">{title}</h1>
        <h3 className="text-lg">{createdAt}</h3>
      </div>

      <div className="flex justify-between bg-gray-100 p-[10px]">
        <h3 className="text-lg">{nickname}</h3>
        <h3 className="text-lg">조회수 : {views}</h3>
      </div>

      <div className="pt-[30px]">
        <p className="text-lg whitespace-pre-wrap">{contents}</p>
      </div>

      {isAuthor && (
        <div className="mt-8 flex justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
            onClick={goEdit}
          >
            수정
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-red-300 text-red-600 bg-white hover:bg-red-50"
            onClick={openDelete}
          >
            삭제
          </button>
        </div>
      )}

      {/* 구분선 */}
      <div className="mt-10 mb-4"><div className="flex items-center gap-3"><div className="flex-1 border-t border-gray-200" /></div></div>

      <CommentsSection postId={params.pageId} />

      {/* 🗑️ 삭제 확인 팝업 */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="px-4 py-3 border-b">
              <h3 className="text-base font-semibold">게시글 삭제</h3>
            </div>
            <div className="p-4 text-sm text-gray-700">
              <p className="mb-2">정말로 이 게시글을 삭제하시겠습니까?</p>
              {title && (
                <blockquote className="rounded-md border bg-gray-50 px-3 py-2 text-gray-600">
                  {title}
                </blockquote>
              )}
              {deleteErr && <p className="mt-2 text-red-600">{deleteErr}</p>}
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t">
              <button
                type="button"
                onClick={closeDelete}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                disabled={deleting}
              >
                취소
              </button>
              <button
                type="button"
                onClick={submitDelete}
                disabled={deleting}
                className={
                  "px-4 py-2 text-sm font-semibold rounded-lg text-white " +
                  (deleting ? "bg-red-300 cursor-not-allowed" : "bg-red-500 hover:bg-red-600")
                }
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewPostPage;
