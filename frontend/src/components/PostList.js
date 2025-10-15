import PagePreview from './PagePreview.js'
import { useNavigate, useParams } from "react-router";
import { useState, useEffect } from 'react';
import axios from 'axios';

function PostList() {
    const [postlist, setPostlist] = useState([])
    const params = useParams();
    const dashboard = params.dashboard;
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('/api/post/all')
            .then(response => {
                setPostlist(response.data.data)
                console.log(`setting with ${response.data.data}`)
            })
            .catch(error => {

            })
    }, []);
    //console.log(postlist); // id 배열 출력

    const handleWritePost = () => {
        const isLoggedIn = window.localStorage.getItem("token") ? true : false;
        if (isLoggedIn) {
            navigate(`/createpost?boardType=${dashboard}`)
        } else {
            window.localStorage.setItem("afterLogin", `/createpost?boardType=${dashboard}`);
            navigate('/login');
        }
    }

    const filtered = postlist.filter(page => !dashboard || page.type === dashboard);
    const sorted = filtered
        .slice()
        .sort((a, b) => {
            const ta = new Date(a?.createdAt || 0).getTime();
            const tb = new Date(b?.createdAt || 0).getTime();
            return tb - ta; // 최신이 위로
        });
    return (
        <div>
            <div className="flex items-center justify-between">
                <div className="font-bold text-2xl pt-4 pb-4">
                    전체 게시글 보기
                </div>
                <button
                    className="w-auto p-2 h-auto bg-blue-500 text-white text-xs font-bold rounded-xl hover:bg-blue-600"
                    onClick={handleWritePost}
                >
                    게시글 작성
                </button>
            </div>
            <div className="pr-[0%]">
                {sorted.length > 0 ? (
                    sorted.map(page => <PagePreview key={page.postId} page={page} />)
                ) : (
                    <p>해당 유형의 게시글이 없습니다.</p>
                )}
            </div>
        </div>
    );
}

export default PostList;