import React from 'react';
import { useNavigate } from "react-router-dom";

function SampleSidebar() {

  const navigate = useNavigate();
  const gotoLoginPage = () => {
    navigate("/login");
  }
  return (
    <div className="flex">
      <div className="w-1/4 bg-gray-200 h-screen p-4">
        <h2 className="text-xl font-bold mb-4">SAMPLE SIDEBAR</h2>

        <button
          onClick = {gotoLoginPage}
          className="w-full p-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600"
        >
          로그인
        </button>
      </div>
    </div>

  );
}

export default SampleSidebar;
