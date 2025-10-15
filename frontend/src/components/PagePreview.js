import { useNavigate } from "react-router";

function formatRelativeKorean(dateLike) {
  if (!dateLike) return "-";
  const created = new Date(dateLike);
  if (isNaN(created.getTime())) return "-";

  const now = new Date();
  const diffMs = Math.max(0, now - created);
  const sec = Math.floor(diffMs / 1000);
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

// 스켈레톤 한 카드
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

  if (loading) {
    return <PreviewSkeleton />;
  }

  const author = page?.userId ?? "알 수 없음";
  const createdRel = formatRelativeKorean(page?.createdAt);
  const type = page?.type ?? "";

  const typeLabelMap = {
    notice: "공지사항",
    free: "자유게시판",
    qna: "Q&A",
  };
  const typeLabel = typeLabelMap[type] ?? "전체 게시판";

  const handleTypeClick = (e) => {
    e.stopPropagation();
    if (!type) return;
    navigate(`/dashboards/${type}`);
  };

  const handleTitleClick = () => {
    navigate(`/pages/${page.postId}`);
  };

  return (
    <div
      className="border-b border-gray-200 py-3 hover:bg-gray-50 cursor-pointer transition"
      onClick={handleTitleClick}
    >
      {/* 제목 + [댓글수] */}
      <h1 className="font-semibold text-[15px] text-gray-800 hover:text-blue-700 hover:underline underline-offset-2 decoration-blue-500">
        {page?.title} {`[${commentCount}]`}
      </h1>

      {/* 게시판명 / 작성자 / 작성시간 */}
      <div className="text-sm text-gray-500 mt-0.5">
        <span
          onClick={handleTypeClick}
          className="text-blue-600 hover:underline cursor-pointer"
        >
          {typeLabel}
        </span>
        <span className="mx-1 text-gray-400">/</span>
        <span>{author}</span>
        <span className="mx-1 text-gray-400">·</span>
        <time>{createdRel}</time>
      </div>

      {/* 본문 미리보기 */}
      <p className="text-gray-700 text-[14px] mt-1 line-clamp-2">
        {page?.contents}
      </p>
    </div>
  );
}

export default PagePreview;
