import PagePreview from './PagePreview.js';
import { useNavigate, useLocation } from "react-router";
import { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';

const PAGE_SIZE = 10;

function PostList() {
  const [postlist, setPostlist] = useState([]);
  const [commentCounts, setCommentCounts] = useState({}); // postId -> count
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("desc");
  const navigate = useNavigate();
  const location = useLocation();

  const extractBoard = (pathname) => {
    const m = pathname.match(/^\/dashboards\/([^\/\?]+)/);
    return m ? m[1] : "";
  };
  const [dashboard, setDashboard] = useState(() => extractBoard(location.pathname) || "");

  useEffect(() => {
    const dFromUrl = extractBoard(location.pathname);
    if (dFromUrl) {
      setDashboard(dFromUrl);
    } else {
      setDashboard("");
    }
    setPage(1);
  }, [location.pathname]);

  // 전체 글 목록 로드
  useEffect(() => {
    api.get('/post/all')
      .then((response) => setPostlist(response.data?.data ?? []))
      .catch((error) => console.error("게시글 목록 로드 실패:", error));
  }, []);

  // 게시글 목록이 바뀌면 댓글 개수 병렬로 로드
  useEffect(() => {
    if (!postlist || postlist.length === 0) {
      setCommentCounts({});
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const tasks = postlist.map((p) =>
          api.get(`/comment/post/${p.postId}`, { signal: controller.signal })
              .then((res) => {
                // 응답 형태 방어적으로 처리 (data.data 배열 or data 배열)
                const payload = res.data;
                const list = Array.isArray(payload?.data) ? payload.data
                           : Array.isArray(payload) ? payload
                           : [];
                return { id: p.postId, count: list.length };
              })
              .catch(() => ({ id: p.postId, count: 0 }))
        );

        const results = await Promise.all(tasks);
        const map = {};
        results.forEach(({ id, count }) => { map[id] = count; });
        setCommentCounts(map);
      } catch (_) {
        // 무시 (abort 등)
      }
    })();

    return () => controller.abort();
  }, [postlist]);

  const handleWritePost = () => {
    const isLoggedIn = !!window.localStorage.getItem("accessToken");
    if (isLoggedIn) {
      navigate(`/createpost?boardType=${dashboard}`);
    } else {
      window.localStorage.setItem("afterLogin", `/createpost?boardType=${dashboard}`);
      navigate('/login');
    }
  };

  // 필터링: 홈(=dashboard === "")이면 전체 보기
  const shouldFilter = dashboard !== "";
  const filtered = useMemo(
    () => (shouldFilter
      ? postlist.filter(p => (p.type || "").toLowerCase() === dashboard.toLowerCase())
      : postlist),
    [postlist, shouldFilter, dashboard]
  );

  // 정렬
  const sorted = useMemo(() => {
    const s = [...filtered].sort((a, b) => {
      const ta = new Date(a?.createdAt || 0).getTime();
      const tb = new Date(b?.createdAt || 0).getTime();
      return sortOrder === "desc" ? (tb - ta) : (ta - tb);
    });
    return s;
  }, [filtered, sortOrder]);

  // 페이지네이션
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  if (page > totalPages) setPage(totalPages);

  const startIdx = (page - 1) * PAGE_SIZE;
  const currentItems = sorted.slice(startIdx, startIdx + PAGE_SIZE);

  const gotoPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  const getPagesToShow = () => {
    const pages = [];
    const add = (p) => pages.push(p);
    const addEllipsis = (key) => pages.push(key);

    const windowSize = 2;
    const left = Math.max(1, page - windowSize);
    const right = Math.min(totalPages, page + windowSize);

    add(1);
    if (left > 2) addEllipsis('...-l');

    for (let p = left; p <= right; p++) {
      if (p !== 1 && p !== totalPages) add(p);
    }

    if (right < totalPages - 1) addEllipsis('...-r');
    if (totalPages > 1) add(totalPages);

    return [...new Set(pages)];
  };

  const pagesToShow = getPagesToShow();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="font-bold text-2xl pt-4 pb-4">전체 게시글 보기</div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">
            정렬    :    &nbsp;
            <select
              value={sortOrder}
              onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-300 bg-white text-sm px-2 py-1 outline-none hover:border-gray-400 focus:ring-2 focus:ring-blue-200"
            >
              <option value="desc">최신순</option>
              <option value="asc">오래된 순</option>
            </select>
          </label>

          <button
            className="w-auto px-3 py-2 bg-blue-500 text-white text-xs font-bold rounded-xl hover:bg-blue-600 shadow-sm"
            onClick={handleWritePost}
          >
            게시글 작성
          </button>
        </div>
      </div>

      <div className="pr-[0%]">
        {currentItems.length > 0 ? (
          currentItems.map(p => (
            <PagePreview
              key={p.postId}
              page={p}
              commentCount={commentCounts[p.postId] ?? 0}
            />
          ))
        ) : (
          <p className="text-gray-500">해당 유형의 게시글이 없습니다.</p>
        )}
      </div>

      {sorted.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, sorted.length)} / {sorted.length}
          </div>

          <nav className="flex items-center gap-3" aria-label="페이지 네비게이션">
            <button
              onClick={() => gotoPage(page - 1)}
              disabled={page === 1}
              className={
                "px-3 py-1.5 rounded-full text-sm border transition " +
                (page === 1
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50")
              }
            >
              ← 이전
            </button>

            {pagesToShow.map((p, idx) =>
              typeof p === "number" ? (
                <button
                  key={`p-${p}-${idx}`}
                  onClick={() => gotoPage(p)}
                  aria-current={page === p ? "page" : undefined}
                  className={
                    "min-w-[36px] px-3 py-1.5 rounded-full text-sm font-medium transition border " +
                    (page === p
                      ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50")
                  }
                >
                  {p}
                </button>
              ) : (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 text-gray-400 select-none"
                >
                  …
                </span>
              )
            )}

            <button
              onClick={() => gotoPage(page + 1)}
              disabled={page === totalPages}
              className={
                "px-3 py-1.5 rounded-full text-sm border transition " +
                (page === totalPages
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50")
              }
            >
              다음 →
            </button>
          </nav>

          <div className="w-[96px]" />
        </div>
      )}

      <div className="h-16" />
    </div>
  );
}

export default PostList;
