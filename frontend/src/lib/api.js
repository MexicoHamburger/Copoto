// api.js
import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

/* ----------------- 토큰 유틸 ----------------- */
const getTokens = () => ({
  access: localStorage.getItem("accessToken"),
  refresh: localStorage.getItem("refreshToken"),
  csrf: localStorage.getItem("csrf"),
});

const setTokens = ({ accessToken, refreshToken, csrf }) => {
  if (accessToken) localStorage.setItem("accessToken", accessToken);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
  if (csrf) localStorage.setItem("csrf", csrf);
};

/* ----------------- 공용 상태 ----------------- */
let isRefreshing = false;
let queue = [];

// 큐에 요청 대기시키기
const enqueue = () =>
  new Promise((resolve, reject) => queue.push({ resolve, reject }));

// 큐 비우기
const flushQueue = (error, newAccessToken) => {
  queue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(newAccessToken);
  });
  queue = [];
};

/* ----------------- 요청 인터셉터 ----------------- */
api.interceptors.request.use((config) => {
  const { access, csrf } = getTokens();
  if (access) config.headers.Authorization = `Bearer ${access}`;
  if (csrf) config.headers["X-CSRF-Token"] = csrf;
  config.headers["Content-Type"] = "application/json";
  config._retry = config._retry ?? false;
  return config;
});

/* ----------------- 응답 인터셉터 ----------------- */
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    const original = error?.config;

    // 네트워크 오류 등은 바로 던짐
    if (!status || !original) return Promise.reject(error);

    // refresh 요청에서의 401/403은 무한 루프 방지
    const isRefreshCall = original.url?.includes("/user/token/refresh");

    // 401 → refresh 시도
    if (status === 401 && !isRefreshCall) {
      // 이미 refresh 중이면 큐에 대기
      if (isRefreshing) {
        try {
          const newToken = await enqueue();
          original.headers.Authorization = `Bearer ${newToken}`;
          original._retry = true;
          return api(original);
        } catch (e) {
          return Promise.reject(e);
        }
      }

      // 내가 refresh 주도
      if (original._retry) return Promise.reject(error);
      original._retry = true;
      isRefreshing = true;

      try {
        const { refresh } = getTokens();
        if (!refresh) {
          console.warn("refreshToken 없음. 로그인 필요.");
          return Promise.reject(error);
        }

        // refresh 요청 (axios 기본 인스턴스로)
        const refreshRes = await axios.post(
          "/api/user/token/refresh",
          { refreshToken: refresh },
          { headers: { "Content-Type": "application/json" }, withCredentials: true }
        );

        const { accessToken, refreshToken, csrf } = refreshRes?.data?.data || {};
        if (!accessToken) throw new Error("새 토큰 없음");

        // 저장 및 기본 헤더 갱신
        setTokens({ accessToken, refreshToken, csrf });
        api.defaults.headers.Authorization = `Bearer ${accessToken}`;
        flushQueue(null, accessToken);

        // 원래 요청 재시도
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (err) {
        flushQueue(err, null);
        console.error("토큰 리프레시 실패:", err);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // 403 등은 그대로 던짐
    return Promise.reject(error);
  }
);
