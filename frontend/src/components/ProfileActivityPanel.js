import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../lib/api";

/**
 * 활동 탭 컴포넌트
 * props:
 *  - userId: 프로필 대상 사용자 ID
 *  - isSelf?: boolean
 *  - labels?: { posts?: string, comments?: string, scraps?: string }
 */
export default function ProfileActivityPanel({ userId, isSelf = true, labels }) {
  const navigate = useNavigate();

  const [tab, setTab] = useState("posts"); // "posts" | "comments" | "bookmarks"
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);         // [{postId, title, createdAt, viewCount, userId}, ...]
  const [comments, setComments] = useState([]);   // [{commentId, postId, content, createdAt, userId}, ...]
  const [bookmarks, setBookmarks] = useState([]); // TBD

  const defaultLabels = isSelf
    ? { posts: "내 게시글", comments: "내 댓글", scraps: "내 스크랩" }
    : { posts: "작성한 게시글", comments: "작성한 댓글", scraps: "스크랩" };
  const effectiveLabels = { ...defaultLabels, ...(labels || {}) };

  // ===== 데이터 로드 =====
  useEffect(() => {
    if (!userId) return;
    let mounted = true;

    async function fetchData() {
      setLoading(true);
      try {
        if (tab === "posts") {
          // 관례적 엔드포인트: /post/user/{userId}
          // 응답 예시 가정: { status, message, data: [{postId, title, createdAt, viewCount, userId}, ...] }
          try {
            const res = await api.get(`/post/user/${encodeURIComponent(userId)}`);
            if (!mounted) return;
            const list = Array.isArray(res?.data?.data) ? res.data.data : [];
            setPosts(list);
          } catch {
            // 엔드포인트가 없거나 실패하면 빈 목록
            if (mounted) setPosts([]);
          }
        } else if (tab === "comments") {
          // 문서 제공된 엔드포인트
          const res = await api.get(`/comment/user/${encodeURIComponent(userId)}`);
          if (!mounted) return;
          const list = Array.isArray(res?.data?.data) ? res.data.data : [];
          setComments(list);
        } else if (tab === "bookmarks") {
          // TODO: 스크랩 API 생기면 여기서 호출
          // 예: const res = await api.get(`/user/${userId}/bookmarks`);
          // setBookmarks(res.data?.data ?? []);
          setBookmarks([]);
        }
      } catch (e) {
        console.error("활동 데이터 로드 실패:", e);
        if (mounted) {
          if (tab === "posts") setPosts([]);
          if (tab === "comments") setComments([]);
          if (tab === "bookmarks") setBookmarks([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => { mounted = false; };
  }, [tab, userId]);

  // ===== 공용 UI =====
  const SkeletonLine = ({ w = "w-3/4" }) => (
    <div className={`h-4 ${w} bg-gray-200 rounded animate-pulse`} />
  );

  const PostItem = ({ item }) => (
    <button
      onClick={() => navigate(`/pages/${item.postId}`)}
      className="w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-800 hover:underline">{item.title}</h3>
        <span className="text-xs text-gray-500">조회 {item.viewCount ?? 0}</span>
      </div>
      <div className="mt-0.5 text-xs text-gray-500">
        {item.userId ?? userId} · {formatDateKR(item.createdAt)}
      </div>
    </button>
  );

  const CommentItem = ({ item }) => (
    <button
      onClick={() => navigate(`/pages/${item.postId}`)}
      className="w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-800 line-clamp-1 hover:underline">
          {item.content}
        </h3>
        <span className="text-xs text-gray-500">게시글 #{item.postId}</span>
      </div>
      <div className="mt-0.5 text-xs text-gray-500">
        {item.userId ?? userId} · {formatDateKR(item.createdAt)}
      </div>
    </button>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      {/* 탭 */}
      <div className="flex items-center gap-2 px-2 pt-2">
        {[
          { key: "posts", label: effectiveLabels.posts },
          { key: "comments", label: effectiveLabels.comments },
          { key: "bookmarks", label: effectiveLabels.scraps },
        ].map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={
                "px-3 py-2 rounded-xl text-sm font-semibold " +
                (active
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-50 border border-transparent")
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 리스트 */}
      <div className="mt-2">
        {loading ? (
          <div className="p-4 space-y-3">
            <SkeletonLine w="w-4/5" />
            <SkeletonLine w="w-3/5" />
            <SkeletonLine w="w-2/3" />
          </div>
        ) : (
          <>
            {tab === "posts" && (
              <div className="min-h-[160px]">
                {posts.length ? (
                  posts.map((p) => <PostItem key={p.postId} item={p} />)
                ) : (
                  <EmptyHint text="표시할 게시글이 없습니다." />
                )}
              </div>
            )}

            {tab === "comments" && (
              <div className="min-h-[160px]">
                {comments.length ? (
                  comments.map((c) => <CommentItem key={c.commentId} item={c} />)
                ) : (
                  <EmptyHint text="표시할 댓글이 없습니다." />
                )}
              </div>
            )}

            {tab === "bookmarks" && (
              <div className="min-h-[160px]">
                {bookmarks.length ? (
                  bookmarks.map((b) => <PostItem key={b.postId} item={b} />)
                ) : (
                  <EmptyHint text="표시할 스크랩이 없습니다." />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyHint({ text }) {
  return <div className="p-6 text-sm text-gray-500">{text}</div>;
}

function formatDateKR(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
