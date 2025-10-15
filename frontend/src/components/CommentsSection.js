import { useEffect, useState, useCallback } from "react";
import axios from "axios";

export default function CommentsSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createMsg, setCreateMsg] = useState(""); // 성공/실패 안내

  const isLoggedIn = !!window.localStorage.getItem("token");
  const userId = window.localStorage.getItem("userid") || ""; // ← 로그인 시 저장해둔 값 사용

  const loadComments = useCallback(async () => {
    if (!postId) return;
    try {
      setLoading(true);
      setErrMsg("");
      const res = await axios.get(`/api/comment/post/${postId}`);
      // 예상: res.data.data 가 배열
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setComments(list);
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

      const payload = {
        userId,          // string
        postId: Number(postId), // API가 number로 받는다면 변환
        content: input.trim(),
      };

      const res = await axios.post("/api/comment/create", payload);
      // 200 성공: res.data.data 안에 생성된 댓글(필드명: commentId, content, userId, postId, createdAt, hateSpeech)
      const created = res.data?.data;
      if (created?.commentId) {
        setComments((prev) => [created, ...prev]);
        setInput("");
        setCreateMsg("댓글이 등록되었습니다.");
      } else {
        setCreateMsg("댓글 등록 결과를 확인할 수 없습니다.");
      }
    } catch (e) {
      // 403 혐오표현 탐지 케이스
      if (axios.isAxiosError(e) && e.response?.status === 403) {
        const msg = e.response?.data?.message || "혐오 표현이 감지되어 등록되지 않았습니다.";
        setCreateMsg(msg);
      } else {
        setCreateMsg("댓글 등록 중 오류가 발생했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xl font-bold">댓글</h2>

      {/* 입력 영역 */}
      <form
        onSubmit={handleCreate}
        className="mb-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
      >
        <textarea
          placeholder={isLoggedIn ? "댓글을 입력하세요." : "로그인 후 댓글을 작성할 수 있습니다."}
          className="h-24 w-full resize-none rounded-lg border border-gray-300 p-3 outline-none placeholder:text-gray-400 disabled:bg-gray-50"
          disabled={!isLoggedIn || submitting}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-500">
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
              (isLoggedIn && input.trim() && !submitting
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-blue-300 cursor-not-allowed")
            }
          >
            댓글 작성
          </button>
        </div>
      </form>

      {/* 목록 영역 */}
      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
          불러오는 중…
        </div>
      ) : errMsg ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errMsg}
          <button
            onClick={loadComments}
            className="ml-2 text-blue-600 underline underline-offset-2"
          >
            다시 시도
          </button>
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
          첫 댓글을 작성해보세요!
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((c) => (
            <li key={c.commentId} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-800">
                  {c.userId ?? "익명"}
                </div>
                <div className="text-xs text-gray-400">{formatKST(c.createdAt)}</div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{c.content}</p>
              {c.hateSpeech && (
                <div className="mt-2 text-xs text-red-600">※ 신고/필터 대상</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** 간단한 KST 포맷터 (서버가 ISO8601 문자열 주는 기준) */
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
