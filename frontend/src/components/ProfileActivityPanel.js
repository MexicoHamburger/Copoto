import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

/**
 * 활동 탭 껍데기 컴포넌트
 * - posts / comments / bookmarks 탭 제공
 * - 로딩 스켈레톤 / 빈 상태 / 리스트 UI 준비
 * - API 연동은 TODO 표시된 곳에 맞춰 추가
 */
export default function ProfileActivityPanel({ userId }) {
  const navigate = useNavigate();

  // 탭 상태: "posts" | "comments" | "bookmarks"
  const [tab, setTab] = useState("posts");

  // 로딩/데이터 상태 (초기 비어 있음)
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);         // [{postId, title, createdAt, viewCount, userId}, ...]
  const [comments, setComments] = useState([]);   // [{commentId, postId, content, createdAt, userId}, ...]
  const [bookmarks, setBookmarks] = useState([]); // [{postId, title, createdAt, viewCount, userId}, ...]

  // 탭 전환 시마다 불릴 자리(지금은 껍데기만, 실제 API 나오면 여기서 호출)
  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      setLoading(true);
      try {
        // TODO: API 나오면 아래 형태로 채워주세요.
        // 예시:
        // if (tab === "posts") {
        //   const res = await api.get(`/user/${userId}/posts?limit=10`);
        //   if (!mounted) return;
        //   setPosts(res.data?.data ?? []);
        // }
        // if (tab === "comments") { ... }
        // if (tab === "bookmarks") { ... }

        // 지금은 껍데기만이므로 아무 것도 안 함.
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
          { key: "posts", label: "내 게시글" },
          { key: "comments", label: "내 댓글" },
          { key: "bookmarks", label: "스크랩" },
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
                  <EmptyHint text="아직 불러올 게시글이 없습니다. API 연동 후 표시됩니다." />
                )}
              </div>
            )}

            {tab === "comments" && (
              <div className="min-h-[160px]">
                {comments.length ? (
                  comments.map((c) => <CommentItem key={c.commentId} item={c} />)
                ) : (
                  <EmptyHint text="아직 불러올 댓글이 없습니다. API 연동 후 표시됩니다." />
                )}
              </div>
            )}

            {tab === "bookmarks" && (
              <div className="min-h-[160px]">
                {bookmarks.length ? (
                  bookmarks.map((b) => <PostItem key={b.postId} item={b} />)
                ) : (
                  <EmptyHint text="아직 불러올 스크랩이 없습니다. API 연동 후 표시됩니다." />
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
  return (
    <div className="p-6 text-sm text-gray-500">
      {text}
    </div>
  );
}

function formatDateKR(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });
}
