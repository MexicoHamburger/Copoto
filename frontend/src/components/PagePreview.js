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

  // 닉네임 초기값: 캐시 있으면 값, 없으면 undefined(=로딩 필요), userId 없으면 null(=표시 안 함이지만 로딩 완료 판단)
  const initialNick = useMemo(() => {
    if (!userId) return null;
    return nicknameCache.has(userId) ? nicknameCache.get(userId) : undefined;
  }, [userId]);
  const [nickname, setNickname] = useState(initialNick);

  // 조회수 초기값: 목록에 숫자가 있으면 그대로(완료), 캐시 있으면 캐시, 그 외 undefined(=로딩 필요), postId 없으면 null
  const initialViews = useMemo(() => {
    if (typeof page?.viewCount === "number") return page.viewCount;
    if (!postId) return null;
    return viewCountCache.has(postId) ? viewCountCache.get(postId) : undefined;
  }, [postId, page?.viewCount]);
  const [views, setViews] = useState(initialViews);

  // 개별 fetch
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
        .catch(() => mounted && setNickname(userId)); // 실패 시 아이디로 대체(=로딩 완료)
    }

    if (postId && views === undefined) {
      api
        .get(`/post/${postId}`)
        .then((res) => {
          const cnt = res?.data?.data?.post?.viewCount;
          if (mounted) {
            const v = typeof cnt === "number" ? cnt : null; // 못받으면 null로 완료 처리
            if (typeof v === "number") viewCountCache.set(postId, v);
            setViews(v);
          }
        })
        .catch(() => mounted && setViews(null));
    }

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, postId]);

  // ✅ 모든 준비가 끝났는지 판단 (스켈레톤은 여기서 한 번에 제거)
  const nickReady = nickname !== undefined;  // undefined면 아직 로딩 중
  const viewsReady = views !== undefined;    // undefined면 아직 로딩 중
  const allReady = nickReady && viewsReady;

  if (loading || !allReady) return <PreviewSkeleton />;

  // ----- 여기부터 실제 카드 -----
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

  const handleTitleClick = () => {
    navigate(`/pages/${postId}`);
  };

  return (
    <div
      className="border-b border-gray-200 py-3 hover:bg-gray-50 cursor-pointer transition"
      onClick={handleTitleClick}
    >
      <h1 className="font-semibold text-[15px] text-gray-800 hover:text-blue-700 hover:underline underline-offset-2 decoration-blue-500">
        {page?.title} {`[${commentCount}]`}
      </h1>

      <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-1 flex-wrap">
        <span
          onClick={handleTypeClick}
          className="text-blue-600 hover:underline cursor-pointer"
        >
          {typeLabel}
        </span>
        <span className="text-gray-300">/</span>
        <span>{author}</span>
        <span className="text-gray-300">·</span>
        <time>{createdRel}</time>
        {typeof views === "number" && (
          <>
            <span className="text-gray-300">·</span>
            <span>조회 {views.toLocaleString()}</span>
          </>
        )}
      </div>

      <p className="text-gray-700 text-[14px] mt-1 line-clamp-2">
        {page?.contents}
      </p>
    </div>
  );
}

export default PagePreview;
