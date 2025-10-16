import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // 쿠키 기반이면 유지
});

/** ========================
 *  공용 상태 & 유틸
 *  ======================== */
let isRefreshing = false;
let requestQueue = []; // {resolve, reject}

const enqueue = () =>
  new Promise((resolve, reject) => requestQueue.push({ resolve, reject }));

const flushQueue = (error, newAccessToken) => {
  requestQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(newAccessToken);
  });
  requestQueue = [];
};

const getTokens = () => ({
  access: localStorage.getItem('accessToken'),
  refresh: localStorage.getItem('refreshToken'),
  csrf: localStorage.getItem('csrf'),
});

const setTokens = ({ accessToken, refreshToken, csrf }) => {
  if (accessToken) localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  if (csrf) localStorage.setItem('csrf', csrf);
};

const clearTokensAndGoLogin = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('csrf');
  const after = window.location.pathname + window.location.search;
  localStorage.setItem('afterLogin', after);
  window.location.href = '/login';
};

/** ========================
 *  요청 인터셉터
 *  ======================== */
api.interceptors.request.use((config) => {
  const { access, csrf } = getTokens();

  if (access) config.headers.Authorization = `Bearer ${access}`;
  if (csrf) config.headers['X-CSRF-Token'] = csrf;

  // 명시적 JSON
  config.headers['Content-Type'] = 'application/json';

  // 무한루프 방지용 플래그
  config._retry = config._retry ?? false;
  return config;
});

/** ========================
 *  응답 인터셉터 (401 → refresh)
 *  ======================== */
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    const original = error?.config;

    // 네트워크 에러 등은 그대로 던짐
    if (!status || !original) return Promise.reject(error);

    // refresh 엔드포인트에서의 401/403은 즉시 로그아웃
    const isRefreshCall =
      original.url?.includes('/user/token/refresh') ||
      original.url?.includes('/token/refresh');

    // 401만 자동갱신 트리거 (403은 권한문제 가능성 높아 바로 던짐)
    if (status === 401 && !isRefreshCall) {
      if (original._retry) {
        // 이미 한 번 재시도했는데 또 401이면 로그인으로
        clearTokensAndGoLogin();
        return Promise.reject(error);
      }

      // 현재 다른 요청이 리프레시 중이면 큐에 합류
      if (isRefreshing) {
        try {
          const newToken = await enqueue(); // resolve(newAccessToken) 받을 때까지 대기
          original.headers.Authorization = `Bearer ${newToken}`;
          original._retry = true;
          return api(original);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      // 내가 리프레시 주도
      original._retry = true;
      isRefreshing = true;

      try {
        const { refresh } = getTokens();
        if (!refresh) {
          clearTokensAndGoLogin();
          return Promise.reject(error);
        }

        // refresh 호출은 기본 axios 인스턴스(인터셉터 비탑승)로 안전하게
        const refreshRes = await axios.post(
          '/api/user/token/refresh',
          { refreshToken: refresh },
          { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
        );

        const { accessToken, refreshToken, csrf } = refreshRes?.data?.data || {};
        if (!accessToken) {
          clearTokensAndGoLogin();
          return Promise.reject(error);
        }

        // 저장 & 기본 헤더 업데이트
        setTokens({ accessToken, refreshToken, csrf });
        api.defaults.headers.Authorization = `Bearer ${accessToken}`;

        // 큐 비우고 재시도
        flushQueue(null, accessToken);

        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (e) {
        // 리프레시 실패 → 모두 실패 처리 & 로그인 이동
        flushQueue(e, null);
        clearTokensAndGoLogin();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    // 403 같은 권한 오류는 그대로
    return Promise.reject(error);
  }
);
