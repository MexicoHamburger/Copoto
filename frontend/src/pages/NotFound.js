import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';

function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 3000); // 3초 후 홈으로 리디렉션
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold">404 Not Found</h1>
      <p className="text-lg mt-2">페이지를 찾을 수 없습니다.</p>
      <p className="text-gray-500 mt-2">3초 후 홈으로 이동합니다...</p>
    </div>
  );
}

export default NotFound;
