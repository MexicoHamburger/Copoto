import { useParams, useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import parseDate from "../util/parseDate";
import CommentsSection from "../components/CommentsSection";

function ViewPostPage() {
  const [title, setTitle] = useState("");
  const [contents, setContents] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [nickname, setNickname] = useState(""); // ✅ 닉네임으로 변경
  const [views, setViews] = useState("");
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

    // 1️⃣ 게시글 정보 가져오기
    api
      .get(`/post/${params.pageId}`, { signal: controller.signal })
      .then(async (response) => {
        const data = response.data?.data ?? {};
        setTitle(data.title ?? "");
        setContents(data.contents ?? "");
        setCreatedAt(parseDate(data.createdAt));
        setViews(data.viewCount ?? "");

        // 2️⃣ userId -> 닉네임 변환
        const userId = data.userId ?? "";
        if (userId) {
          try {
            const profileRes = await api.get(`/user/profile/${encodeURIComponent(userId)}`);
            const nick = profileRes?.data?.data?.nickname ?? userId;
            setNickname(nick);
          } catch {
            setNickname(userId); // fallback: 실패 시 아이디 그대로
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

  return (
    <div className="pt-[30px]">
      <div className="flex justify-between border-t-2 border-b-2 border-gray-300 bg-gray-200 p-[10px]">
        <h1 className="text-3xl">{title}</h1>
        <h3 className="text-lg">{createdAt}</h3>
      </div>
      <div className="flex justify-between bg-gray-100 p-[10px]">
        <h3 className="text-lg">{nickname}</h3> {/* ✅ 닉네임 표시 */}
        <h3 className="text-lg">조회수 : {views}</h3>
      </div>
      <div className="pt-[30px]">
        <p className="text-lg whitespace-pre-wrap">{contents}</p>
      </div>

      {/* 댓글 섹션 */}
      <CommentsSection postId={params.pageId} />
    </div>
  );
}

export default ViewPostPage;
