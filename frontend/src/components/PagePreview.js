import { useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

// 메모리 캐시
const nicknameCache = new Map(); // userId -> nickname
const viewCountCache = new Map(); // postId -> viewCount

function formatRelativeKorean(dateLike) {
  if (!dateLike) return "-";
  const d = new Date(dateLike);
  if (isNaN(d.getTime())) return "-";
  const now = new Date();
  const diff = Math.max(0, now - d);
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);
  const year = Math.floor(day / 365);
  if (sec < 60) return "0분 전";
  if (min < 60) return `${min}분 전`;
  if (hour < 24) return `${hour}시간 전`;
  if (day < 365) return `${day}일 전`;
  return `${year}년 전`;
}

// 스켈레톤(카드 단위)
function PreviewSkeleton() {
  return (
    <div className="border-b border-gray-200 py-3">
      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
      <div className="mt-2 flex items-center gap-3">
        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="mt-2 h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
      <div className="mt-1 h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}

function PagePreview({ page, commentCount = 0, loading = false }) {
  const navigate = useNavigate();

  const userId = page?.userId ?? null;
  const postId = page?.postId ?? null;

  // 닉네임 캐시
  const initialNick = useMemo(() => {
    if (!userId) return null;
    return nicknameCache.has(userId) ? nicknameCache.get(userId) : undefined;
  }, [userId]);
  const [nickname, setNickname] = useState(initialNick);

  // 조회수 캐시
  const initialViews = useMemo(() => {
    if (typeof page?.viewCount === "number") return page.viewCount;
    if (!postId) return null;
    return viewCountCache.has(postId) ? viewCountCache.get(postId) : undefined;
  }, [postId, page?.viewCount]);
  const [views, setViews] = useState(initialViews);

  // 데이터 fetch
  useEffect(() => {
    let mounted = true;

    if (userId && nickname === undefined) {
      api
        .get(`/user/profile/${encodeURIComponent(userId)}`)
        .then((res) => {
          const nick = res?.data?.data?.nickname ?? userId;
          nicknameCache.set(userId, nick);
          if (mounted) setNickname(nick);
        })
        .catch(() => mounted && setNickname(userId));
    }

    if (postId && views === undefined) {
      api
        .get(`/post/${postId}`)
        .then((res) => {
          const cnt = res?.data?.data?.post?.viewCount;
          if (mounted) {
            const v = typeof cnt === "number" ? cnt : null;
            if (typeof v === "number") viewCountCache.set(postId, v);
            setViews(v);
          }
        })
        .catch(() => mounted && setViews(null));
    }

    return () => { mounted = false; };
  }, [userId, postId, nickname, views]);

  // 로딩 여부
  const allReady = nickname !== undefined && views !== undefined;
  if (loading || !allReady) return <PreviewSkeleton />;

  const author = nickname ?? userId ?? "알 수 없음";
  const createdRel = formatRelativeKorean(page?.createdAt);
  const type = page?.type ?? "";
  const typeLabelMap = { notice: "공지사항", free: "자유게시판", qna: "Q&A" };
  const typeLabel = typeLabelMap[type] ?? "전체 게시판";

  const handleTypeClick = (e) => {
    e.stopPropagation();
    if (!type) return;
    navigate(`/dashboards/${type}`);
  };

  const handleTitleClick = (e) => {
    e.stopPropagation();
    navigate(`/pages/${postId}`);
  };

  const handleAuthorClick = (e) => {
    e.stopPropagation();
    if (!userId) return;
    navigate(`/profile?sid=${encodeURIComponent(userId)}`);
  };

  return (
    <div className="border-b border-gray-200 py-3 transition">
      {/* 제목 클릭 */}
      <h1
        onClick={handleTitleClick}
        className="font-semibold text-[15px] text-gray-800 hover:text-blue-700 hover:underline underline-offset-2 decoration-blue-500 cursor-pointer"
      >
        {page?.title} {`[${commentCount}]`}
      </h1>

      {/* 게시판, 작성자, 날짜, 조회수 */}
      <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-1 flex-wrap">
        {/* 게시판 */}
        <span
          onClick={handleTypeClick}
          className="text-blue-600 hover:underline cursor-pointer"
        >
          {typeLabel}
        </span>

        <span className="text-gray-300">/</span>

        {/* 작성자 */}
        <span
          onClick={handleAuthorClick}
          className="hover:underline cursor-pointer text-gray-700"
        >
          {author}
        </span>

        <span className="text-gray-300">·</span>
        <time>{createdRel}</time>

        {typeof views === "number" && (
          <>
            <span className="text-gray-300">·</span>
            <span>조회 {views.toLocaleString()}</span>
          </>
        )}
      </div>

      {/* 본문 내용 (클릭 안 됨) */}
      <p className="text-gray-700 text-[14px] mt-1 line-clamp-2 select-text">
        {page?.contents}
      </p>
    </div>
  );
}

export default PagePreview;
