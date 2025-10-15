import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import parseDate from '../util/parseDate';
import CommentsSection from '../components/CommentsSection';

function ViewPostPage() {
  const [title, setTitle] = useState("");
  const [contents, setContents] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [username, setUsername] = useState("");
  const params = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/post/${params.pageId}`)
      .then(response => {
        setTitle(response.data.data.title);
        setContents(response.data.data.contents);
        setCreatedAt(parseDate(response.data.data.createdAt));
        setUsername(response.data.data.userId);
      })
      .catch(error => {
        console.log(error);
        navigate('/404');
      });
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
          <h3 className="text-lg">조회수: 0 (미구현 ㅎㅎ)</h3>
        </div>
        <div className="pt-[30px]">
          <p className="text-lg whitespace-pre-wrap">{contents}</p>
        </div>

        {/* ✅ 분리된 댓글 섹션 */}
        <CommentsSection postId={params.pageId} />
      </div>
    </>
  );
}

export default ViewPostPage;
