import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const postData = {
    id: username,
    password: password
  };

  const handleLogin = (e) => {
    e.preventDefault();
    
    if (username === "") {
      setHasError(true);
      setErrorMessage("id를 입력해주세요.");
    }
    else if (password === "") {
      setHasError(true);
      setErrorMessage("비밀번호를 입력해주세요.");
    }
    else {
      setHasError(false);
      axios.post('/api/user/login', postData)
      .then(response => {
      const { accessToken, refreshToken } = response.data.data;

      window.localStorage.setItem("accessToken", accessToken);
      window.localStorage.setItem("refreshToken", refreshToken);

        window.localStorage.setItem("userid", username);
        const toGo = window.localStorage.getItem("afterLogin") || "/";
        navigate(toGo);
      })
      .catch(error => {
        if(error.response) {
          setHasError(true);
          const errorCode = error.response.status;

          const errors = {
            401 : "아이디 또는 비밀번호가 잘못되었습니다.",
          }
          setErrorMessage(errors[errorCode]);
        }
      })
    }

  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Copoto</h1>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="username">
              Username
            </label>
            <input
              type="text"
              id="username"
              className="w-full p-2 border border-gray-300 rounded"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full p-2 border border-gray-300 rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {
            hasError && (
            <div className = "text-red-500 mb-4">
              {errorMessage}
            </div>
          )}
          <button
            type="submit"
            className="w-full p-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600"
          >
            Login
          </button>
          <div className = "flex justify-between mt-4">
            <h3 
              className = "text-m text-center hover:cursor-pointer"
              onClick = {() => navigate("/register")}
            >새로 오셨나요?</h3>
            <h3 className = "text-m text-center">계정을 잊으셨나요? (미구현)</h3>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;