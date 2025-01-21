import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from 'react';
import axios from 'axios';
import parseDate from '../util/parseDate';
function ViewPostPage() {
    const [title, setTitle] = useState("");
    const [contents, setContents] = useState("");
    const [createdAt, setCreatedAt] = useState("");
    const [username, setUsername] = useState("");
    const params = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        axios.get(`/api/post/${params.pageId}`)
            .then(response => {
                setTitle(response.data.data.title);
                setContents(response.data.data.contents);
                setCreatedAt(parseDate(response.data.data.createdAt));
                setUsername(response.data.data.userId);
            })
            .catch(error => {
                console.log(error)
                navigate('/404');
            })
    }, [params.pageId, navigate]);

    return (
        <>
            <div className="pt-[30px]">
                <div className="p-[10px] bg-gray-200 flex justify-between border-t-2 border-b-2 border-gray-300">
                    <h1 className="text-3xl">{title}</h1>
                    <h3 className="text-lg">{createdAt}</h3>
                </div>
                <div className="bg-gray-100 p-[10px] flex justify-between">
                    <h3 className="text-lg">{username}</h3>
                    <h3 className="text-lg">조회수: 0 (미구현 ㅎㅎ)</h3>
                </div>
                <div className="pt-[30px]">
                    <p className="text-lg">{contents}</p>
                </div>
            </div>
        </>
    );
}

export default ViewPostPage;