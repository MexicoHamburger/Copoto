// api.js
import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

/* ---------- 토큰 유틸 ---------- */
const getTokens = () => ({
  access: localStorage.getItem('accessToken'),
  csrf: localStorage.getItem('csrf'),
});

/* ---------- 요청 인터셉터 ---------- */
api.interceptors.request.use((config) => {
  const { access, csrf } = getTokens();
  if (access) config.headers.Authorization = `Bearer ${access}`;
  if (csrf) config.headers['X-CSRF-Token'] = csrf;
  config.headers['Content-Type'] = 'application/json';
  return config;
});

/* ---------- 응답 인터셉터 ---------- */
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    // 그대로 던져서 컴포넌트 단에서 처리하도록
    return Promise.reject(error);
  }
);
