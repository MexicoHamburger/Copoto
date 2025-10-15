import PagePreview from './PagePreview.js';
import { useNavigate, useLocation } from "react-router";
import { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';

const PAGE_SIZE = 10;

/* 리스트 로딩 시 스켈레톤 */
function SkeletonLine({ w = "w-4/5" }) {
    return <div className={`h-4 ${w} bg-gray-200 rounded animate-pulse`} />;
}
function SkeletonRow() {
    return (
        <div className="border-b border-gray-100 py-3">
            <div className="mb-2"><SkeletonLine w="w-3/4" /></div>
            <div className="flex items-center gap-2">
                <SkeletonLine w="w-24" />
                <SkeletonLine w="w-16" />
                <SkeletonLine w="w-20" />
            </div>
            <div className="mt-2"><SkeletonLine w="w-5/6" /></div>
            <div className="mt-1"><SkeletonLine w="w-2/3" /></div>
        </div>
    );
}
function SkeletonList({ count = 6 }) {
    return (
        <div className="pr-[0%]">
            {Array.from({ length: count }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
    );
}

function PostList() {
    const [postlist, setPostlist] = useState([]);
    const [commentCounts, setCommentCounts] = useState({}); // postId -> count
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [loadingComments, setLoadingComments] = useState(false);

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
        setDashboard(dFromUrl || "");
        setPage(1);
    }, [location.pathname]);

    // 전체 글 목록 로드
    useEffect(() => {
        const controller = new AbortController();
        setLoadingPosts(true);
        api.get('/post/all', { signal: controller.signal })
            .then((response) => setPostlist(response.data?.data ?? []))
            .catch((error) => {
                if (error.name !== 'CanceledError') console.error("게시글 목록 로드 실패:", error);
            })
            .finally(() => setLoadingPosts(false));
        return () => controller.abort();
    }, []);

    // 게시글 목록이 바뀌면 댓글 개수 병렬로 로드
    useEffect(() => {
        if (!postlist || postlist.length === 0) {
            setCommentCounts({});
            return;
        }
        const controller = new AbortController();
        setLoadingComments(true);

        (async () => {
            try {
                const tasks = postlist.map((p) =>
                    api.get(`/comment/post/${p.postId}`, { signal: controller.signal })
                        .then((res) => {
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
            } catch (_) { /* noop */ }
            finally { setLoadingComments(false); }
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

    const isLoadingList = loadingPosts; // 목록 자체 로딩
    const isEmptyAfterLoad = !loadingPosts && currentItems.length === 0;
    const boardLabelMap = { free: "자유게시판", qna: "Q&A", notice: "공지사항" };

    return (
        <div>
            <div className="flex items-center justify-between">
                <div className="font-bold text-2xl pt-8 pb-4">
                    {dashboard
                        ? `${boardLabelMap[dashboard?.toLowerCase()] ?? "전체"}`
                        : "전체 게시글 보기"}
                </div>

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

            {/* 리스트 영역 */}
            {isLoadingList ? (
                <SkeletonList count={6} />
            ) : (
                <div className="pr-[0%]">
                    {isEmptyAfterLoad ? (
                        <div className="p-6 text-gray-500">해당 유형의 게시글이 없습니다.</div>
                    ) : (
                        currentItems.map(p => {
                            // 댓글 수가 아직 계산 전이면 카드 전체를 스켈레톤으로
                            const itemLoading = loadingComments && commentCounts[p.postId] === undefined;
                            return (
                                <PagePreview
                                    key={p.postId}
                                    page={p}
                                    commentCount={commentCounts[p.postId] ?? 0}
                                    loading={itemLoading}
                                />
                            );
                        })
                    )}
                </div>
            )}

            {/* 페이지네이션 */}
            {!isLoadingList && sorted.length > 0 && (
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
