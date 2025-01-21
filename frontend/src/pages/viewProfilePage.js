import { useEffect, useState } from 'react';
import axios from 'axios';
import tempImg from '../images/copotoLogo.png';
import parseDate from '../util/parseDate';

function ViewPostPage() {
    const [nickname, setNickname] = useState("");
    const [createdAt, setCreatedAt] = useState("");
    const userid = window.localStorage.getItem("userid");

    useEffect(() => {
        axios.get(`/api/user/profile/${userid}`)
            .then(response => {
                setNickname(response.data.data.nickname);
                setCreatedAt(parseDate(response.data.data.createdAt));
            })
            .catch(error => {
                console.log(error)
            })
    }, [])
    return (
        <>
            <div className="pt-[10%] ml-[10%] mr-[10%] flex items-center">
                {/* 프로필 사진 */}
                <div className="w-[150px] h-[150px] p-4 border-2 flex items-center justify-center">
                    <img className="max-w-full max-h-full" src={tempImg} alt="profile Image" />
                </div>

                {/* 유저 정보 */}
                <div className="flex flex-col justify-between h-[150px] ml-5 text-xl">
                    <div>아이디 : {userid}</div>
                    <div>닉네임 : {nickname}</div>
                    <div>계정 생성 날짜 : {createdAt}</div>
                </div>
            </div>
        </>
    );
}

export default ViewPostPage;