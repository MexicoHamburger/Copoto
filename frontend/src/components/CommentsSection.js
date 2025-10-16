import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";

/* ===== 닉네임 유틸 ===== */
const nicknameCache = new Map();
const pendingReqs = new Map();
async function getNickname(userId) {
  if (!userId) return "익명";
  if (nicknameCache.has(userId)) return nicknameCache.get(userId);
  if (pendingReqs.has(userId)) return pendingReqs.get(userId);
  const p = api
    .get(`/user/profile/${encodeURIComponent(userId)}`)
    .then((res) => res?.data?.data?.nickname ?? userId)
    .catch(() => userId)
    .finally(() => pendingReqs.delete(userId));
  pendingReqs.set(userId, p);
  const nick = await p;
  nicknameCache.set(userId, nick);
  return nick;
}
async function resolveNicknames(userIds) {
  const uniq = Array.from(new Set(userIds.filter(Boolean)));
  const pairs = await Promise.all(uniq.map(async (uid) => [uid, await getNickname(uid)]));
  return Object.fromEntries(pairs);
}

/* ===== 날짜 포맷 ===== */
function formatKST(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${y}-${m}-${day} ${hh}:${mm}`;
  } catch {
    return iso;
  }
}

export default function CommentsSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [nicknameMap, setNicknameMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createMsg, setCreateMsg] = useState("");

  // ✏️ 인라인 편집
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editErr, setEditErr] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // 🗑️ 삭제 확인 모달
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, preview }
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState("");

  const isLoggedIn = !!window.localStorage.getItem("accessToken");
  const myUserId = window.localStorage.getItem("userid") || "";

  const loadComments = useCallback(async () => {
    if (!postId) return;
    try {
      setLoading(true);
      setErrMsg("");
      const res = await api.get(`/comment/post/${postId}`);
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setComments(list);
      const map = await resolveNicknames(list.map((c) => c.userId));
      setNicknameMap((prev) => ({ ...prev, ...map }));
    } catch (e) {
      setErrMsg("댓글을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) return alert("로그인이 필요합니다.");
    if (!input.trim()) return;

    try {
      setSubmitting(true);
      setCreateMsg("");
      const payload = { userId: myUserId, postId: Number(postId), content: input.trim() };
      const res = await api.post("/comment/create", payload);
      const created = res.data?.data;
      if (created?.commentId) {
        const nick = await getNickname(created.userId);
        setNicknameMap((prev) => ({ ...prev, [created.userId]: nick }));
        setComments((prev) => [created, ...prev]);
        setInput("");
        setCreateMsg("댓글이 등록되었습니다.");
      } else {
        setCreateMsg("댓글 등록 결과를 확인할 수 없습니다.");
      }
    } catch (e) {
      if (e.response?.status === 403) {
        const msg = e.response?.data?.message || "혐오 표현이 감지되어 등록되지 않았습니다.";
        setCreateMsg(msg);
      } else {
        setCreateMsg("댓글 등록 중 오류가 발생했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ===== 인라인 편집 핸들러 ===== */
  const startEdit = (c) => {
    setEditingId(c.commentId);
    setEditText(c.content || "");
    setEditErr("");
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
    setEditErr("");
    setEditSubmitting(false);
  };
  const submitEdit = async () => {
    const trimmed = editText.trim();
    if (!trimmed) return setEditErr("내용을 입력해주세요.");
    try {
      setEditSubmitting(true);
      setEditErr("");
      const res = await api.put(`/comment/${editingId}`, { content: trimmed });
      const updated = res?.data?.data;
      if (!updated?.commentId) throw new Error("empty");
      setComments((prev) =>
        prev.map((c) =>
          c.commentId === updated.commentId
            ? { ...c, content: updated.content, hateSpeech: updated.hateSpeech ?? c.hateSpeech }
            : c
        )
      );
      cancelEdit();
    } catch (e) {
      const s = e?.response?.status;
      const msg =
        s === 401 ? "로그인이 필요합니다."
        : s === 403 ? "이 댓글을 수정할 권한이 없습니다."
        : s === 404 ? "댓글을 찾을 수 없습니다."
        : s === 405 ? (e?.response?.data?.message || "혐오 발언이 감지되어 수정되지 않았습니다.")
        : "댓글 수정 중 오류가 발생했습니다.";
      setEditErr(msg);
      setEditSubmitting(false);
    }
  };

  /* ===== 삭제 핸들러 ===== */
  const openDelete = (c) => {
    setDeleteErr("");
    setDeleteTarget({ id: c.commentId, preview: c.content?.slice(0, 40) || "" });
  };
  const closeDelete = () => {
    setDeleteTarget(null);
    setDeleteErr("");
    setDeleting(false);
  };
  const submitDelete = async () => {
    try {
      setDeleting(true);
      setDeleteErr("");
      await api.delete(`/comment/${deleteTarget.id}`);
      // 편집 중이던 대상이면 편집 닫기
      if (editingId === deleteTarget.id) cancelEdit();
      // 목록에서 제거
      setComments((prev) => prev.filter((c) => c.commentId !== deleteTarget.id));
      closeDelete();
    } catch (e) {
      const s = e?.response?.status;
      const msg =
        s === 401 ? "로그인이 필요합니다."
        : s === 403 ? "이 댓글을 삭제할 권한이 없습니다."
        : s === 404 ? "댓글을 찾을 수 없습니다."
        : "댓글 삭제 중 오류가 발생했습니다.";
      setDeleteErr(msg);
      setDeleting(false);
    }
  };

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xl font-bold">댓글</h2>

      {/* 안내 배너 */}
      <div className="flex items-center bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-3 mb-3 shadow-sm">
        <span className="mr-2">⚠️</span>
        <p className="text-sm font-medium">
          혐오표현 탐지 AI가 작동 중입니다. 부적절한 표현이 감지될 경우 게시글/댓글 게시가 제한됩니다.
        </p>
      </div>

      {/* 입력 */}
      <form onSubmit={handleCreate} className="mb-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <textarea
          placeholder={isLoggedIn ? "댓글을 입력하세요." : "로그인 후 댓글을 작성할 수 있습니다."}
          className="h-24 w-full resize-none rounded-lg border border-gray-300 p-3 outline-none placeholder:text-gray-400 disabled:bg-gray-50"
          disabled={!isLoggedIn || submitting}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs">
            {createMsg && (
              <span className={/혐오|등록되지/i.test(createMsg) ? "text-red-600" : "text-green-600"}>
                {createMsg}
              </span>
            )}
          </span>
          <button
            type="submit"
            disabled={!isLoggedIn || submitting || !input.trim()}
            className={
              "rounded-lg px-4 py-2 text-sm font-semibold text-white " +
              (isLoggedIn && input.trim() && !submitting ? "bg-blue-500 hover:bg-blue-600" : "bg-blue-300 cursor-not-allowed")
            }
          >
            댓글 작성
          </button>
        </div>
      </form>

      {/* 목록 */}
      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">불러오는 중…</div>
      ) : errMsg ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errMsg}
          <button onClick={loadComments} className="ml-2 text-blue-600 underline underline-offset-2">다시 시도</button>
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">첫 댓글을 작성해보세요!</div>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((c) => {
            const isMine = !!myUserId && c.userId === myUserId;
            const isEditing = editingId === c.commentId;
            return (
              <li key={c.commentId} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                {/* 헤더: 닉네임 | (수정/삭제) 날짜 */}
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-800">
                    {nicknameMap[c.userId] ?? c.userId ?? "익명"}
                  </div>
                  <div className="flex items-center gap-2">
                    {isMine && (
                      <>
                        <button
                          type="button"
                          className="px-2.5 py-1 text-xs font-semibold rounded-md border border-gray-300 bg-white hover:bg-gray-50"
                          onClick={() => (isEditing ? cancelEdit() : startEdit(c))}
                        >
                          {isEditing ? "닫기" : "수정"}
                        </button>
                        <button
                          type="button"
                          className="px-2.5 py-1 text-xs font-semibold rounded-md border border-red-300 text-red-600 bg-white hover:bg-red-50"
                          onClick={() => openDelete(c)}
                        >
                          삭제
                        </button>
                      </>
                    )}
                    <div className="text-xs text-gray-400 tabular-nums min-w-[92px] text-right">
                      {formatKST(c.createdAt)}
                    </div>
                  </div>
                </div>

                {/* 내용 */}
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{c.content}</p>
                {c.hateSpeech && <div className="mt-2 text-xs text-red-600">※ 신고/필터 대상</div>}

                {/* 인라인 편집 */}
                {isEditing && (
                  <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-center text-xs text-gray-500 mb-2">
                      <span className="mr-2">↪</span>
                      <span className="font-medium">댓글 수정</span>
                      {editText && <span className="ml-2">({`${editText.length}자`})</span>}
                      {editErr && <span className="ml-2 text-red-600">{editErr}</span>}
                    </div>
                    <div className="flex gap-3">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        disabled={editSubmitting}
                        className="h-24 flex-1 resize-none rounded-md border border-gray-300 p-3 outline-none bg-white"
                        placeholder="수정할 내용을 입력하세요."
                        onKeyDown={(e) => {
                          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") submitEdit();
                        }}
                      />
                      <button
                        type="button"
                        onClick={submitEdit}
                        disabled={editSubmitting || !editText.trim()}
                        className={
                          "h-24 w-[72px] rounded-md text-sm font-semibold text-white " +
                          (editSubmitting || !editText.trim()
                            ? "bg-blue-300 cursor-not-allowed"
                            : "bg-blue-500 hover:bg-blue-600")
                        }
                      >
                        등록
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* 🗑️ 삭제 확인 팝업 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="px-4 py-3 border-b">
              <h3 className="text-base font-semibold">댓글 삭제</h3>
            </div>
            <div className="p-4 text-sm text-gray-700">
              <p className="mb-2">정말로 이 댓글을 삭제하시겠습니까?</p>
              {deleteTarget.preview && (
                <blockquote className="rounded-md border bg-gray-50 px-3 py-2 text-gray-600">
                  {deleteTarget.preview}
                  {deleteTarget.preview.length >= 40 ? "…" : ""}
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
    </section>
  );
}
