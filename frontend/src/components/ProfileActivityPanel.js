import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

/**
 * 활동 탭 컴포넌트
 * props:
 *  - userId: 프로필 대상 사용자 ID
 *  - isSelf?: boolean (내 프로필인지 여부) — 라벨 기본값에만 영향
 *  - labels?: { posts?: string, comments?: string, scraps?: string }  // 라벨 오버라이드
 *
 *  예) 타인 프로필에서:
 *    <ProfileActivityPanel
 *      userId="someone"
 *      isSelf={false}
 *      labels={{ posts: "작성한 게시글", comments: "작성한 댓글", scraps: "스크랩" }}
 *    />
 */
export default function ProfileActivityPanel({ userId, isSelf = true, labels }) {
  const navigate = useNavigate();

  // 탭 상태: "posts" | "comments" | "bookmarks"
  const [tab, setTab] = useState("posts");

  // 로딩/데이터 상태
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);         // [{postId, title, createdAt, viewCount, userId}, ...]
  const [comments, setComments] = useState([]);   // [{commentId, postId, content, createdAt, userId}, ...]
  const [bookmarks, setBookmarks] = useState([]); // [{postId, title, createdAt, viewCount, userId}, ...]

  // ✅ 라벨: props.labels가 오면 덮어쓰기, 아니면 isSelf에 맞는 기본값
  const defaultLabels = isSelf
    ? { posts: "내 게시글", comments: "내 댓글", scraps: "내 스크랩" }
    : { posts: "작성한 게시글", comments: "작성한 댓글", scraps: "스크랩" };
  const effectiveLabels = { ...defaultLabels, ...(labels || {}) };

  // 탭 전환/유저 변경 시 데이터 로드 (API 붙일 자리)
  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        // TODO: 실제 API 연동
        // if (tab === "posts") {
        //   const res = await api.get(`/user/${userId}/posts?limit=10`);
        //   if (!mounted) return;
        //   setPosts(res.data?.data ?? []);
        // } else if (tab === "comments") {
        //   const res = await api.get(`/user/${userId}/comments?limit=10`);
        //   if (!mounted) return;
        //   setComments(res.data?.data ?? []);
        // } else if (tab === "bookmarks") {
        //   const res = await api.get(`/user/${userId}/bookmarks?limit=10`);
        //   if (!mounted) return;
        //   setBookmarks(res.data?.data ?? []);
        // }
      } catch (e) {
        console.error("활동 데이터 로드 실패:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchData();
    return () => { mounted = false; };
  }, [tab, userId]);

  // 공용 스켈레톤
  const SkeletonLine = ({ w = "w-3/4" }) => (
    <div className={`h-4 ${w} bg-gray-200 rounded animate-pulse`} />
  );

  // 리스트 아이템(게시글/스크랩)
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

  // 리스트 아이템(댓글)
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

      {/* 리스트 영역 */}
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
