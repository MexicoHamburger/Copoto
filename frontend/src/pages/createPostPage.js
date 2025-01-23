import { useSearchParams, useNavigate } from "react-router";
import axios from 'axios';
import { useState } from 'react';

function CreatePostPage() {
    const [searchParams] = useSearchParams();
    const boardType = searchParams.get("boardType"); // 쿼리에서 데이터 읽기
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const navigate = useNavigate();

    const handleTitleBlur = (e) => {
        setTitle(e.target.value);
    };

    const handleContentBlur = (e) => {
        setContent(e.target.value);
    };

    const handlePost = (e) => {
        e.preventDefault();
        if (title === "") {
            alert("제목을 입력해주세요.")
        }
        else if (content === "") {
            alert("내용을 입력해주세요.")
        }
        else {
            const postData = {
                "title": title,
                "contents": content,
                "userId": window.localStorage.getItem("userid")
            };
            console.log(postData)
            axios.post('/api/post/create', postData)
                .then(response => {
                    navigate(`/dashboards/${boardType}`)
                })
                .catch(error => {
                    console.log('something is wrong! umm.. this should not happen..')
                })
        }
    }

    return (
        <div className="pt-[30px]">
            <h1 className="text-3xl">게시글 작성</h1>
            <div className="flex">
                <div id="post_writing_div" className="w-1/2 pr-5">
                    <form onSubmit={handlePost}>
                        <input
                            id="title_writing_input"
                            type="text" placeholder="제목을 입력해주세요."
                            className="w-full h-10 border border-gray-300 rounded-lg mt-5 p-3"
                            onChange={(e) => { setTitle(e.target.value) }}
                            onBlur={(e) => { handleTitleBlur(e) }} />
                        <textarea
                            id="content_writing_textarea"
                            type="text" placeholder="내용을 입력해주세요."
                            className="w-full h-[500px] border border-gray-300 text-left align-top rounded-lg mt-3 p-3 resize-none"
                            onChange={(e) => { setContent(e.target.value) }}
                            onBlur={(e) => { handleContentBlur(e) }} />
                    </form>
                </div>
                <div id="post_showing_div" className="flex-1 pl-5">
                    <div id="title_showing_div" className="w-full h-10 border border-gray-300 rounded-lg mt-5 p-3 flex items-center">
                        {title}
                    </div>
                    <div
                        id="content_showing_div"
                        className="w-full h-[500px] border border-gray-300 text-left align-top rounded-lg mt-3 p-3">
                        {content}
                    </div>
                </div>
            </div>
            <div id="buttons" className="flex">
                <button
                    //구현필요
                    onClick={() => { }}
                    className="mt-5 mr-5 p-2 pl-4 pr-4 h-1/2 bg-gray-200 text-blue-500 text-xs font-bold rounded-lg hover:bg-gray-300"
                >
                    게시글 임시저장 (미구현)
                </button>
                <button
                    //구현필요
                    onClick={() => { }}
                    className="mt-5 p-2 pl-4 pr-4 h-1/2 bg-gray-200 text-blue-500 text-xs font-bold rounded-lg hover:bg-gray-300"
                >
                    임시저장 게시글 불러오기 (미구현)
                </button>
                <button
                    type="submit"
                    className="mt-5 ml-auto p-2 pl-4 pr-4 h-1/2 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600"
                >
                    게시글 작성
                </button>
            </div>
        </div>
    );
}

export default CreatePostPage;