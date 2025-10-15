import { useParams, useNavigate } from "react-router";
import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import parseDate from '../util/parseDate';
import CommentsSection from '../components/CommentsSection';

function ViewPostPage() {
    const [title, setTitle] = useState("");
    const [contents, setContents] = useState("");
    const [createdAt, setCreatedAt] = useState("");
    const [username, setUsername] = useState("");
    const [views, setViews] = useState("");
    const params = useParams();
    const navigate = useNavigate();

    // React 18 StrictMode의 이펙트 두 번 실행 방지
    const fetchedRef = useRef(false);

    // pageId 바뀔 때마다 1회 호출 허용
    useEffect(() => {
        fetchedRef.current = false;
    }, [params.pageId]);

    useEffect(() => {
        if (fetchedRef.current) return;      // 같은 마운트 사이클의 2번째 실행 차단
        fetchedRef.current = true;

        const controller = new AbortController();

        api.get(`/post/${params.pageId}`, { signal: controller.signal })
            .then((response) => {
                const data = response.data?.data ?? {};
                setTitle(data.title ?? "");
                setContents(data.contents ?? "");
                setCreatedAt(parseDate(data.createdAt));
                setUsername(data.userId ?? "");
                setViews(data.viewCount ?? "");
            })
            .catch((error) => {
                if (error.name === 'CanceledError') return;
                console.log(error);
                navigate('/404');
            });

        return () => controller.abort();
    }, [params.pageId, navigate]);

    return (
        <>
            <div className="pt-[30px]">
                <div className="flex justify-between border-t-2 border-b-2 border-gray-300 bg-gray-200 p-[10px]">
                    <h1 className="text-3xl">{title}</h1>
                    <h3 className="text-lg">{createdAt}</h3>
                </div>
                <div className="flex justify-between bg-gray-100 p-[10px]">
                    <h3 className="text-lg">{username}</h3>
                    <h3 className="text-lg">조회수 : {views}</h3>
                </div>
                <div className="pt-[30px]">
                    <p className="text-lg whitespace-pre-wrap">{contents}</p>
                </div>

                {/* 댓글 섹션 */}
                <CommentsSection postId={params.pageId} />
            </div>
        </>
    );
}

export default ViewPostPage;
