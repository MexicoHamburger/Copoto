import { useParams, useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import parseDate from "../util/parseDate";
import CommentsSection from "../components/CommentsSection";

function ViewPostPage() {
    const [title, setTitle] = useState("");
    const [contents, setContents] = useState("");
    const [createdAt, setCreatedAt] = useState("");
    const [nickname, setNickname] = useState("");
    const [views, setViews] = useState("");
    const [authorId, setAuthorId] = useState("");
    const params = useParams();
    const navigate = useNavigate();

    const fetchedRef = useRef(false);

    useEffect(() => {
        fetchedRef.current = false;
    }, [params.pageId]);

    useEffect(() => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;

        const controller = new AbortController();

        api
            .get(`/post/${params.pageId}`, { signal: controller.signal })
            .then(async (response) => {
                const data = response.data?.data ?? {};
                setTitle(data.title ?? "");
                setContents(data.contents ?? "");
                setCreatedAt(parseDate(data.createdAt));
                setViews(data.viewCount ?? "");
                setAuthorId(data.userId ?? "");

                // userId -> 닉네임
                const userId = data.userId ?? "";
                if (userId) {
                    try {
                        const profileRes = await api.get(`/user/profile/${encodeURIComponent(userId)}`);
                        const nick = profileRes?.data?.data?.nickname ?? userId;
                        setNickname(nick);
                    } catch {
                        setNickname(userId);
                    }
                } else {
                    setNickname("알 수 없음");
                }
            })
            .catch((error) => {
                if (error.name === "CanceledError") return;
                console.error(error);
                navigate("/404");
            });

        return () => controller.abort();
    }, [params.pageId, navigate]);

    const myUserId = window.localStorage.getItem("userid") || "";
    const isAuthor = !!authorId && !!myUserId && authorId === myUserId;

    return (
        <div className="pt-[30px]">
            <div className="flex justify-between border-t-2 border-b-2 border-gray-300 bg-gray-200 p-[10px]">
                <h1 className="text-3xl">{title}</h1>
                <h3 className="text-lg">{createdAt}</h3>
            </div>

            <div className="flex justify-between bg-gray-100 p-[10px]">
                <h3 className="text-lg">{nickname}</h3>
                <h3 className="text-lg">조회수 : {views}</h3>
            </div>

            <div className="pt-[30px]">
                <p className="text-lg whitespace-pre-wrap">{contents}</p>
            </div>

            {isAuthor && (
                <div className="mt-8 flex justify-end gap-2">
                    <button
                        type="button"
                        className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                        onClick={() => {/* TODO: 수정 이벤트 연결 예정 */ }}
                    >
                        수정
                    </button>
                    <button
                        type="button"
                        className="px-4 py-2 text-sm font-semibold rounded-lg border border-red-300 text-red-600 bg-white hover:bg-red-50"
                        onClick={() => {/* TODO: 삭제 이벤트 연결 예정 */ }}
                    >
                        삭제
                    </button>
                </div>
            )}
            {/* 댓글 구분선 */}
            <div className="mt-10 mb-4">
                <div className="flex items-center gap-3">
                    <div className="flex-1 border-t border-gray-200" />
                </div>
            </div>

            {/* 댓글 섹션 */}
            <CommentsSection postId={params.pageId} />
        </div>
    );
}

export default ViewPostPage;
