import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";

const nicknameCache = new Map();          // userId -> nickname
const pendingReqs = new Map();            // userId -> Promise<string>

async function getNickname(userId) {
  if (!userId) return "익명";
  if (nicknameCache.has(userId)) return nicknameCache.get(userId);

  // 중복요청 병합
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

// 여러 개를 한 번에 resolve
async function resolveNicknames(userIds) {
  const uniq = Array.from(new Set(userIds.filter(Boolean)));
  const pairs = await Promise.all(uniq.map(async (uid) => [uid, await getNickname(uid)]));
  return Object.fromEntries(pairs);
}

export default function CommentsSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [nicknameMap, setNicknameMap] = useState({});  // userId -> nickname
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createMsg, setCreateMsg] = useState("");

  const isLoggedIn = !!window.localStorage.getItem("accessToken");
  const userId = window.localStorage.getItem("userid") || "";

  const loadComments = useCallback(async () => {
    if (!postId) return;
    try {
      setLoading(true);
      setErrMsg("");
      const res = await api.get(`/comment/post/${postId}`);
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setComments(list);

      // 닉네임 일괄 조회 후 상태 갱신
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

      const payload = {
        userId,
        postId: Number(postId),
        content: input.trim(),
      };

      const res = await api.post("/comment/create", payload);
      const created = res.data?.data;
      if (created?.commentId) {
        // 작성자 닉네임 확보 (캐시/요청)
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
              (isLoggedIn && input.trim() && !submitting
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-blue-300 cursor-not-allowed")
            }
          >
            댓글 작성
          </button>
        </div>
      </form>

      {/* 목록 */}
      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
          불러오는 중…
        </div>
      ) : errMsg ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errMsg}
          <button onClick={loadComments} className="ml-2 text-blue-600 underline underline-offset-2">
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
                <div className="text-m font-semibold text-gray-800">
                  {nicknameMap[c.userId] ?? c.userId ?? "익명"}
                </div>
                <div className="text-xs text-gray-400">{formatKST(c.createdAt)}</div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{c.content}</p>
              {c.hateSpeech && <div className="mt-2 text-xs text-red-600">※ 신고/필터 대상</div>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

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
