import { useNavigate } from "react-router";

function formatRelativeKorean(dateLike) {
  if (!dateLike) return "-";
  const created = new Date(dateLike);
  if (isNaN(created.getTime())) return "-";

  const now = new Date();
  const diffMs = Math.max(0, now - created); // 미래 날짜 방어
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

function PagePreview({ page }) {
  const navigate = useNavigate();
  const author = page?.userId ?? "알 수 없음";
  const createdRel = formatRelativeKorean(page?.createdAt);

  return (
    <div
      className="border p-4 hover:bg-gray-50 cursor-pointer rounded-md"
      onClick={() => navigate(`/pages/${page.postId}`)}
    >
      {/* 제목 */}
      <h1 className="font-bold text-xl pb-1">{page?.title}</h1>

      {/* 메타: 작성자 · 작성일(상대시간) */}
      <div className="text-sm text-gray-500 pb-2">
        <span className="font-medium">{author}</span>
        <span className="mx-2">·</span>
        <time>{createdRel}</time>
      </div>

      {/* 본문 미리보기 (원하면 line-clamp-3 사용) */}
      <p className="text-gray-700 max-h-[72px] overflow-hidden">
        {page?.contents}
      </p>
    </div>
  );
}

export default PagePreview;
