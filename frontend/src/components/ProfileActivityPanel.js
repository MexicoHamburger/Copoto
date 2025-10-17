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
  const [toggling, setToggling] = useState(false);

  const [hidden, setHidden] = useState(false);
  const [authorNick, setAuthorNick] = useState(""); // ✅ 미리보기용 닉네임 상태
  const [posts, setPosts] = useState([]);       
  const [comments, setComments] = useState([]); 
  const [bookmarks, setBookmarks] = useState([]);

  const defaultLabels = isSelf
    ? { posts: "내 게시글", comments: "내 댓글", scraps: "내 스크랩" }
    : { posts: "작성한 게시글", comments: "작성한 댓글", scraps: "스크랩" };
  const effectiveLabels = { ...defaultLabels, ...(labels || {}) };

  // ===== /user/profile/{id} 한 번에 로드 (posts, comments, hide, nickname) =====
  useEffect(() => {
    if (!userId) return;
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/user/profile/${encodeURIComponent(userId)}`);
        if (!mounted) return;

        const data = res?.data?.data || {};
        setHidden(!!data.hide);
        setAuthorNick(data.nickname || ""); // ✅ 닉네임 저장

        const rawPosts = Array.isArray(data.posts) ? data.posts : [];
        const rawComments = Array.isArray(data.comments) ? data.comments : [];

        const mappedPosts = rawPosts.map((p) => ({
          postId: p.postId,
          title: p.title,
          createdAt: p.createdAt,
          viewCount: p.viewCount ?? 0,
          userId: p.userId,
        }));
        const mappedComments = rawComments.map((c) => ({
          commentId: c.commentId,
          postId: c.postId,
          content: c.content,
          createdAt: c.createdAt,
          userId: c.userId,
        }));

        setPosts(mappedPosts);
        setComments(mappedComments);
      } catch (e) {
        console.error("활동 데이터 로드 실패:", e);
        setPosts([]);
        setComments([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [userId]);

  // ===== 비공개 토글 (본인만 가능) =====
  const toggleHide = async () => {
    if (!isSelf || toggling) return;
    const next = !hidden;
    try {
      setToggling(true);
      setHidden(next);
      await api.put("/user/profile/hide", { hide: next });
    } catch (e) {
      console.error("활동 공개/비공개 변경 실패:", e);
      setHidden(!next);
      alert("활동 공개 상태 변경에 실패했습니다.");
    } finally {
      setToggling(false);
    }
  };

  // ===== 공용 UI =====
  const SkeletonLine = ({ w = "w-3/4" }) => (
    <div className={`h-4 ${w} bg-gray-200 rounded animate-pulse`} />
  );

  // ✅ 작성자 라벨은 닉네임 → 없으면 userId → 그래도 없으면 전달된 userId
  const authorLabel = authorNick || posts[0]?.userId || userId;

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
        {authorLabel} · {formatDateKR(item.createdAt)}
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
        {authorLabel} · {formatDateKR(item.createdAt)}
      </div>
    </button>
  );

  // 타인 프로필 + 비공개면 안내만 표시
  if (!isSelf && hidden) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
            비공개
          </span>
        </div>
        <EmptyHint text="이 사용자는 활동을 숨겼습니다." />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      {/* 상단 상태/토글 줄 */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <span
            className={
              "text-xs font-semibold px-2 py-0.5 rounded-full border " +
              (hidden
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200")
            }
          >
            {hidden ? "비공개" : "공개"}
          </span>
          {hidden && isSelf && (
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              내 활동은 현재 다른 사용자에게 보이지 않습니다.
            </span>
          )}
        </div>

        {isSelf && (
          <button
            onClick={toggleHide}
            disabled={toggling}
            className={
              "relative inline-flex h-7 w-14 items-center rounded-full transition " +
              (hidden ? "bg-gray-300" : "bg-blue-500")
            }
            aria-pressed={hidden}
            aria-label="내 활동 숨기기 토글"
            title={hidden ? "비공개" : "공개"}
          >
            <span
              className={
                "inline-block h-6 w-6 transform rounded-full bg-white shadow ring-1 ring-black/5 transition " +
                (hidden ? "translate-x-1" : "translate-x-7")
              }
            />
            <span className="sr-only">활동 공개 상태 전환</span>
          </button>
        )}
      </div>

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
