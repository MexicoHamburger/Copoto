import React, { useState } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const postData = {
    id: username,
    password: password
  };

  const gotoLoginPage = () => {
    navigate('/login');
  }
  const handleRegister = (e) => {
    e.preventDefault();

    axios.post('/api/user/register', postData)
    .then(response =>  {
      gotoLoginPage();
    })
    .catch(error => console.log(error))
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Copoto</h1>
        <form onSubmit={handleRegister}>
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
              required
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
              required
            />
          </div>
          <button
            type="submit"
            className="w-full p-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600"
          >
            회원가입
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;