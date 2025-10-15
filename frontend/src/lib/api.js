import axios from 'axios';

export const api = axios.create({
    baseURL: '/api',
    // 쿠키 기반 인증이면 true, Bearer 토큰만 쓰면 없어도 됨
    withCredentials: true,
});

// 요청 인터셉터: 토큰/CSRF 헤더 주입
api.interceptors.request.use((config) => {
    const token = window.localStorage.getItem('accessToken');
    if (token) {
        // 백엔드가 기대하는 스킴에 따라 'Bearer ' 또는 그냥 token
        config.headers.Authorization = `Bearer ${token}`;
    }
    const csrf = window.localStorage.getItem('csrf'); // 쓰는 중이면
    if (csrf) {
        config.headers['X-CSRF-Token'] = csrf;
    }
    // 명시적 JSON
    config.headers['Content-Type'] = 'application/json';
    return config;
});

// 응답 인터셉터: 401/403 처리
api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error?.response?.status === 401) {
            // 로그인 만료 등
            const after = window.location.pathname + window.location.search;
            window.localStorage.setItem('afterLogin', after);
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);
