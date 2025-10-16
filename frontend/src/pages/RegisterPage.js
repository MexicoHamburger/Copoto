import React, { useState } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import CopotoLogo from "../images/copotoLogo.png";
import eyeIcon from "../images/eye.svg";

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [nicknameMsg, setNicknameMsg] = useState("");          // ✅ 닉네임 전용 에러 메시지
  const [formErrors, setFormErrors] = useState({
    username: false,
    password: false,
    nickname: false,
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const apiRoute = '/api/user';

  const navigate = useNavigate();

  const postData = {
    id: username,
    password: password,
    nickname: nickname
  };

  const gotoLoginPage = () => navigate('/login');

  const handleRegister = (e) => {
    e.preventDefault();

    // 기존 폼 에러가 있으면 막기
    if (Object.values(formErrors).some(Boolean)) return;

    axios.post(apiRoute + '/register', postData)
      .then(() => gotoLoginPage())
      .catch((error) => {
        const code = error?.response?.status;
        if (code === 403) {
          // ✅ 서버 닉네임 검증 실패
          setFormErrors(prev => ({ ...prev, nickname: true }));
          setNicknameMsg("부적절한 닉네임입니다.");
        } else if (code === 409) {
          setFormErrors(prev => ({ ...prev, username: true }));
          setErrorMessage("이미 존재하는 id입니다.");
        } else {
          setErrorMessage("회원가입 요청 중 오류가 발생했습니다.");
        }
      });
  };

  const handleError = (errorField, errorValue) => {
    setFormErrors((prev) => ({ ...prev, [errorField]: errorValue }));
  };

  const hasError = () => Object.values(formErrors).some((error) => error);

  /* ID 관련 함수 */
  const verifyID = () => {
    const idRegex = /^[A-Za-z0-9@$!%*?&]{4,}$/;
    if (idRegex.test(username)) {
      axios.post(apiRoute + '/verify/id', { id: username })
        .then(() => {
          handleError('username', true);
          setErrorMessage("이미 존재하는 id입니다.");
        })
        .catch((error) => {
          const code = error?.response?.status;
          if (code === 404) {
            handleError('username', false);
          } else {
            handleError('username', true);
            const errors = { 400: "id를 입력하세요." };
            setErrorMessage(errors[code] || "아이디 확인 중 오류가 발생했습니다.");
          }
        });
    } else {
      handleError('username', true);
      setErrorMessage(
        username === ''
          ? "아이디를 입력해주세요."
          : "아이디는 4자 이상 및 영문/숫자/특수문자만 가능합니다."
      );
    }
  };

  /* 비밀번호 관련 함수 */
  const togglePasswordVisible = () => setIsPasswordVisible(!isPasswordVisible);

  const verifyPassword = () => {
    const passwordRegex = /^(?=.*[_@$!%?&])[A-Za-z\d_@$!%?&]{8,}$/;
    if (passwordRegex.test(password)) {
      handleError('password', false);
    } else {
      handleError('password', true);
      setErrorMessage("비밀번호는 8자 이상 및 특수문자 한 개 이상을 포함해야 합니다.\n지원하는 특수문자 : [@, _, $, !, %, ?, &]");
    }
  };

  /* 닉네임 관련 함수 */
  const verifyNickname = () => {
    // 입력 비어있음 처리
    if (!nickname.trim()) {
      handleError('nickname', true);
      setNicknameMsg("닉네임을 입력하세요.");
      return;
    }

    axios.post(apiRoute + '/verify/nickname', { nickname })
      .then(() => {
        handleError('nickname', false);
        setNicknameMsg("");                                // ✅ 통과 시 메시지 제거
      })
      .catch((error) => {
        handleError('nickname', true);
        const code = error?.response?.status;
        if (code === 409) setNicknameMsg("닉네임이 이미 사용중입니다.");
        else if (code === 400) setNicknameMsg("닉네임을 입력하세요.");
        else setNicknameMsg("닉네임 확인 중 오류가 발생했습니다.");
      });
  };

  /* 에러메시지 및 에러 UI 관련 함수 */
  const verifyErrorMessage = () => {
    if (formErrors["username"]) verifyID();
    else if (formErrors["password"]) verifyPassword();
    else if (formErrors["nickname"]) verifyNickname();
  };

  const setErrorUI = (type) => {
    const usernameE = formErrors["username"];
    const passwordE = formErrors["password"];
    const nicknameE = formErrors["nickname"];

    if (type === "username") {
      if (usernameE && passwordE) return "border-b-0 border-red-500";
      if (usernameE && !passwordE) return "border-red-500";
      if (!usernameE) return "border-b-0 border-gray-300";
    }
    if (type === "password") {
      if (passwordE) return "border-red-500";
      if (!passwordE) return "border-b-0 border-gray-300";
    }
    if (type === "nickname") {
      if (passwordE && nicknameE) return "border-t-0 border-red-500";
      if (!passwordE && nicknameE) return "border-red-500";
      if (!nicknameE) return "border-gray-300";
    }
    return "border-gray-300";
  };

  // 입력 시 닉네임 에러 메시지 초기화(UX)
  const onNicknameChange = (e) => {
    setNickname(e.target.value);
    setNicknameMsg("");
    // 사용자가 수정 시작하면 에러 플래그는 잠시 내림(검증은 blur에서)
    setFormErrors(prev => ({ ...prev, nickname: false }));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-3xl shadow-md w-full max-w-md">
        <div className="flex justify-center">
          <img src={CopotoLogo} alt="Copoto Logo" className="max-w-[150px] p-4" />
        </div>
        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <input
              type="text"
              id="username"
              className={`w-full p-4 border rounded-t-lg rounded-b-none ${setErrorUI("username")}`}
              value={username}
              placeholder="아이디"
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => { verifyID(); verifyErrorMessage(); }}
              required
            />

            <div className={`flex w-full p-4 border ${setErrorUI("password")}`}>
              <input
                type={isPasswordVisible ? "text" : "password"}
                id="password"
                className="flex-grow"
                value={password}
                placeholder="비밀번호"
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => { verifyPassword(); verifyErrorMessage(); }}
                required
              />
              <img
                src={eyeIcon}
                alt="eye"
                className="flex max-w-[25px] cursor-pointer"
                onClick={togglePasswordVisible}
              />
            </div>

            <input
              type="text"
              id="nickname"
              className={`w-full p-4 border rounded-b-lg ${setErrorUI("nickname")}`}
              value={nickname}
              placeholder="닉네임"
              onChange={onNicknameChange}                     // ✅ 변경
              onBlur={() => { verifyNickname(); verifyErrorMessage(); }}
              required
            />

            {/* ✅ 닉네임 입력칸 바로 아래에 전용 메시지 표시 */}
            {nicknameMsg && (
              <p className="mt-1 text-xs text-red-600">{nicknameMsg}</p>
            )}
          </div>

          {/* 기존 공통 에러(아이디/비번 등) */}
          {hasError() && !nicknameMsg && (
            <div className="text-red-500 mb-4 whitespace-pre-line">{errorMessage}</div>
          )}

          <button
            type="submit"
            className="w-full p-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600 disabled:opacity-60"
            disabled={hasError()}
          >
            회원가입
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
