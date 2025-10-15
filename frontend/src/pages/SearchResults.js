// src/pages/SearchResults.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { api } from '../lib/api';
import PagePreview from "../components/PagePreview";

const useQuery = () => new URLSearchParams(useLocation().search);

export default function SearchResults() {
  const qs = useQuery();
  const qFromUrl = (qs.get("q") || "").trim();
  const [postlist, setPostlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const keyword = qFromUrl || window.localStorage.getItem("searchKeyword") || "";
  const board = window.localStorage.getItem("searchBoard") || "main";

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get("/post/all")
      .then(res => { if (mounted) setPostlist(res.data?.data || []); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [keyword, board]);

  const filtered = useMemo(() => {
    const kw = keyword.toLowerCase();
    const byBoard = board && board !== "main"
      ? postlist.filter(p => p.type === board)
      : postlist;

    if (!kw) return byBoard;

    return byBoard.filter(p => {
      const t = (p.title || "").toLowerCase();
      const c = (p.contents || p.content || "").toLowerCase();
      return t.includes(kw) || c.includes(kw);
    });
  }, [postlist, keyword, board]);

  return (
    <div className="pt-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">
          검색 결과 <span className="text-gray-500 text-sm">({filtered.length}건)</span>
        </h1>
        <div className="text-sm text-gray-500">
          키워드: <span className="font-semibold text-gray-700">{keyword || "없음"}</span>
          <span className="mx-2">|</span>
          범위: <span className="font-semibold text-gray-700">{board === "main" ? "전체" : board}</span>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500">불러오는 중…</div>
      ) : filtered.length ? (
        <div className="space-y-2">
          {filtered.map(p => <PagePreview key={p.postId} page={p} />)}
        </div>
      ) : (
        <div className="text-gray-500">검색 결과가 없습니다.</div>
      )}

      <div className="h-16" />
    </div>
  );
}
