import { useSearchParams, useNavigate } from "react-router";
import axios from 'axios';
import { useState } from 'react';
import { ShieldAlert } from 'lucide-react'; // 아이콘 (lucide-react 사용 시)

function CreatePostPage() {
    const [searchParams] = useSearchParams();
    const boardType = searchParams.get("boardType");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const navigate = useNavigate();
    const [showBadModal, setShowBadModal] = useState(false);

    const handleTitleBlur = (e) => setTitle(e.target.value);
    const handleContentBlur = (e) => setContent(e.target.value);

    const handlePost = (e) => {
        e.preventDefault();
        if (!title) return alert("제목을 입력해주세요.");
        if (!content) return alert("내용을 입력해주세요.");

        const postData = {
            title,
            contents: content,
            userId: window.localStorage.getItem("userid")
        };

        axios.post('/api/post/create', postData)
            .then(() => navigate(`/dashboards/${boardType}`))
            .catch(error => {
                if (axios.isAxiosError(error) && error.response?.status === 403) {
                    setShowBadModal(true);
                    return;
                }
                console.log('something is wrong! umm.. this should not happen..');
            });
    };

    return (
        <div className="pt-[30px]">
            <h1 className="text-3xl mb-4">게시글 작성</h1>

            {/* 🔷 혐오표현 탐지 안내문구 */}
            <div className="flex items-center bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-3 mb-5 shadow-sm">
                <ShieldAlert className="w-5 h-5 mr-2 text-blue-600" />
                <p className="text-sm font-medium">
                    혐오표현 탐지 AI가 작동 중입니다. 부적절한 표현이 감지될 경우 게시글/댓글 게시가 제한됩니다.
                </p>
            </div>

            <div className="flex">
                <div id="post_writing_div" className="w-1/2 pr-5">
                    <input
                        id="title_writing_input"
                        type="text"
                        placeholder="제목을 입력해주세요."
                        className="w-full h-10 border border-gray-300 rounded-lg mt-5 p-3"
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleTitleBlur}
                    />
                    <textarea
                        id="content_writing_textarea"
                        placeholder="내용을 입력해주세요."
                        className="w-full h-[500px] border border-gray-300 rounded-lg mt-3 p-3 resize-none"
                        onChange={(e) => setContent(e.target.value)}
                        onBlur={handleContentBlur}
                    />
                </div>
                <div id="post_showing_div" className="flex-1 pl-5">
                    <div className="w-full h-10 border border-gray-300 rounded-lg mt-5 p-3 flex items-center">
                        {title}
                    </div>
                    <div className="w-full h-[500px] border border-gray-300 rounded-lg mt-3 p-3 whitespace-pre-wrap">
                        {content}
                    </div>
                </div>
            </div>

            <div id="buttons" className="flex">
                <button
                    onClick={() => {}}
                    className="mt-5 mr-5 p-2 pl-4 pr-4 bg-gray-200 text-blue-500 text-xs font-bold rounded-lg hover:bg-gray-300"
                >
                    게시글 임시저장 (미구현)
                </button>
                <button
                    onClick={() => {}}
                    className="mt-5 p-2 pl-4 pr-4 bg-gray-200 text-blue-500 text-xs font-bold rounded-lg hover:bg-gray-300"
                >
                    임시저장 게시글 불러오기 (미구현)
                </button>
                <button
                    onClick={handlePost}
                    className="mt-5 ml-auto p-2 pl-4 pr-4 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600"
                >
                    게시글 작성
                </button>
            </div>

            {showBadModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-lg">
                        <h2 className="text-lg font-bold mb-3">알림</h2>
                        <p className="text-sm text-gray-700 mb-5">
                            부적절한 표현이 감지되었습니다.
                        </p>
                        <div className="text-right">
                            <button
                                onClick={() => setShowBadModal(false)}
                                className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm hover:bg-blue-600"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CreatePostPage;
