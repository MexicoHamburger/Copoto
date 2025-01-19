import React, { useState } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import CopotoLogo from "../images/copotoLogo.png"
import eyeIcon from "../images/eye.svg"

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [formErrors, setFormErrors] = useState({
    username: false,
    password: false,
    nickname: false,
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const apiRoute = '/api/user'

  const navigate = useNavigate();

  const postData = {
    id: username,
    password: password,
    nickname: nickname
  };

  const gotoLoginPage = () => {
    navigate('/login');
  }
  const handleRegister = (e) => {
    e.preventDefault();

    axios.post(apiRoute + '/register', postData)
      .then(response => {
        gotoLoginPage();
      })
      .catch(error => console.log(error))
  };

  const handleError = (errorField, errorValue) => {
    setFormErrors((prev) => ({
      ...prev,
      [errorField]: errorValue
    }))
  };

  const hasError = () => {
    if (Object.values(formErrors).some((error) => error))
      return true;
    return false;
  }
  /* ID 관련 함수 */
  const verifyID = () => {
    const idRegex = /^[A-Za-z0-9@$!%*?&]{4,}$/;
    if (idRegex.test(username)) {
      axios.post(apiRoute + '/verify/id', { id: username })
        .then(response => {
          handleError('username', true);
          setErrorMessage("이미 존재하는 id입니다.")
        })
        .catch(error => {
          if (error.response) {
            const errorCode = error.response.status;
            // 이 부분은 좀 api 수정이 필요해보임
            if (errorCode === 404) {
              handleError('username', false);
            } else {
              handleError('username', true);
              const errors = {
                400: "id를 입력하세요.",
              }
              setErrorMessage(errors[errorCode]);
            }
          }
        })
    }
    else {
      handleError('username', true);
      if (username === '') {
        setErrorMessage("아이디를 입력해주세요.")
      } else {
        setErrorMessage("아이디는 4자 이상 및 영문/숫자/특수문자만 가능합니다.");
      }
    }
  }

  /* 비밀번호 관련 함수 */

  const togglePasswordVisible = () => {
    setIsPasswordVisible(!isPasswordVisible)
  }
  const verifyPassword = () => {
    const passwordRegex = /^(?=.*[_@$!%?&])[A-Za-z\d_@$!%?&]{8,}$/;
    if (passwordRegex.test(password)) {
      handleError('password', false);
    }
    else {
      handleError('password', true);
      setErrorMessage("비밀번호는 8자 이상 및 특수문자 한 개 이상을 포함해야 합니다.\n지원하는 특수문자 : [@, _, $, !, %, ?, &]")
    }
  }

  /* 닉네임 관련 함수 */

  const verifyNickname = () => {
    axios.post(apiRoute + '/verify/nickname', { nickname: nickname })
      .then(response => {
        handleError('nickname', false);
      })
      .catch(error => {
        if (error.response) {
          handleError('nickname', true);
          const errorCode = error.response.status;

          const errors = {
            400: "닉네임을 입력하세요.",
            409: "닉네임이 이미 사용중입니다."
          }
          setErrorMessage(errors[errorCode]);
        }
      })
  }
  /* 에러메시지 및 에러 UI 관련 함수 */

  const verifyErrorMessage = () => {
    console.log(formErrors)
    if (formErrors["username"]) {
      verifyID();
    } else if (formErrors["password"]) {
      verifyPassword();
    } else if (formErrors["nickname"]) {
      verifyNickname();
    }
  }

  const setErrorUI = (type) => {
    console.log(formErrors)
    const username = formErrors["username"]
    const password = formErrors["password"]
    const nickname = formErrors["nickname"]

    if (type === "username") {
      if (username && password) return "border-b-0 border-red-500";
      if (username && !password) return "border-red-500";
      if (!username) return "border-b-0 border-gray-300"
    }

    if (type === "password") {
      if (password) return "border-red-500";
      if (!password) return "border-b-0 border-gray-300";
    }

    if (type === "nickname") {
      if (password && nickname) return "border-t-0 border-red-500";
      if (!password && nickname) return "border-red-500";
      if (!nickname) return "border-b-0 border-gray-300"
    }
    // Default class, but should not happen
    return "border-gray-300";
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
              onBlur={() => {
                verifyID();
                verifyErrorMessage();
              }}
              required
            />
            <div className={`flex w-full p-4 border ${setErrorUI("password")}`}>
              <input
                type={`${isPasswordVisible ? "text" : "password"}`}
                id="password"
                className="flex-grow"
                value={password}
                placeholder="비밀번호"
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => {
                  verifyPassword();
                  verifyErrorMessage();
                }}
                required
              />
              <img src={eyeIcon} alt="eye" className="flex max-w-[25px]" onClick={togglePasswordVisible} ></img>
            </div>
            <input
              type="text"
              id="nickname"
              className={`w-full p-4 border rounded-b-lg ${setErrorUI("nickname")}`}
              value={nickname}
              placeholder="닉네임"
              onChange={(e) => setNickname(e.target.value)}
              onBlur={() => {
                verifyNickname();
                verifyErrorMessage();
              }}
              required
            />
          </div>
          {hasError() && (
            <div className="text-red-500 mb-4">
              {errorMessage}
            </div>
          )}
          <button
            type="submit"
            className="w-full p-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600"
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