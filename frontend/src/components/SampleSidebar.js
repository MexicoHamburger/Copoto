import React, { useState } from 'react';

function SampleSidebar() {

  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    console.log('아이디:', userId);
    console.log('비밀번호:', password);
    // 이 userId, password를 backend 저장 테스트에 사용하면 됩니다.
  };

  return (
    <div className="flex">
      <div className="w-1/4 bg-gray-200 h-screen p-4">
        <h2 className="text-xl font-bold mb-4">SAMPLE SIDEBAR</h2>

        <input
          type="text"
          placeholder="아이디"
          className="w-full p-2 mb-2 border rounded"
          onChange = {(e) => setUserId(e.target.value)}
        />

        <input
          type="text"
          placeholder="비밀번호"
          className="w-full p-2 mb-2 border rounded"
          onChange = {(e) => setPassword(e.target.value)}
        />

        <button
          onClick = {handleLogin}
          className="w-full p-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600"
        >
          로그인
        </button>
      </div>
    </div>

  );
}

export default SampleSidebar;
