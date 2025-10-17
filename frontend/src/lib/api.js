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

const clearTokensAndGoLogin = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("csrf");
  const after = window.location.pathname + window.location.search;
  localStorage.setItem("afterLogin", after);
  window.location.href = "/login";
};

/* ----------------- 동시성 제어 ----------------- */
let isRefreshing = false;
let queue = []; // { resolve, reject }

const enqueue = () =>
  new Promise((resolve, reject) => queue.push({ resolve, reject }));

const flushQueue = (error, newAccessToken) => {
  queue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(newAccessToken)
  );
  queue = [];
};

/* ----------------- 요청 인터셉터 ----------------- */
api.interceptors.request.use((config) => {
  const { access, csrf } = getTokens();
  if (access) config.headers.Authorization = `Bearer ${access}`;
  if (csrf) config.headers["X-CSRF-Token"] = csrf;
  config.headers["Content-Type"] = "application/json";
  // 원요청이 refresh 후 재시도를 이미 수행했는지 표시
  if (typeof config._retriedAfterRefresh !== "boolean") {
    config._retriedAfterRefresh = false;
  }
  return config;
});

/* ----------------- 응답 인터셉터 ----------------- */
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    const original = error?.config;

    // 구성 정보 없거나 401 이외 에러는 그대로 던짐
    if (!status || !original) return Promise.reject(error);

    const isRefreshCall = original.url?.includes("/user/token/refresh");

    // 🔁 refresh 자체가 401/403 등으로 실패하면 즉시 로그아웃
    if (isRefreshCall && (status === 401 || status === 403)) {
      clearTokensAndGoLogin();
      return Promise.reject(error);
    }

    // ✅ 일반 요청에서 401 → refresh 시도
    if (status === 401 && !isRefreshCall) {
      // 이미 refresh 후 원요청 1회 재시도까지 했는데 또 401이면 로그아웃
      if (original._retriedAfterRefresh) {
        clearTokensAndGoLogin();
        return Promise.reject(error);
      }

      // 다른 탭/요청이 refresh 중이면 큐 대기 -> 새 토큰으로 1회 재시도
      if (isRefreshing) {
        try {
          const newToken = await enqueue();
          original.headers.Authorization = `Bearer ${newToken}`;
          original._retriedAfterRefresh = true; // 이 재시도는 refresh 이후 1회 시도로 간주
          return api(original);
        } catch (e) {
          // 대기 중 실패 전파
          return Promise.reject(e);
        }
      }

      // 내가 refresh 주도
      isRefreshing = true;
      try {
        const { refresh } = getTokens();
        if (!refresh) {
          // refresh 토큰 없으면 곧장 로그아웃
          clearTokensAndGoLogin();
          return Promise.reject(error);
        }

        // 기본 axios로 refresh 호출 (인터셉터 비탑승)
        const refreshRes = await axios.post(
          "/api/user/token/refresh",
          { refreshToken: refresh },
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
          }
        );

        const { accessToken, refreshToken, csrf } = refreshRes?.data?.data || {};
        if (!accessToken) {
          clearTokensAndGoLogin();
          return Promise.reject(error);
        }

        // 저장 + 기본 헤더 갱신
        setTokens({ accessToken, refreshToken, csrf });
        api.defaults.headers.Authorization = `Bearer ${accessToken}`;

        // 큐에 성공 전달
        flushQueue(null, accessToken);

        // ▶ 원요청 1회 재시도
        original.headers.Authorization = `Bearer ${accessToken}`;
        original._retriedAfterRefresh = true;
        return api(original);
      } catch (e) {
        // refresh 실패 → 전부 실패 처리 후 로그아웃
        flushQueue(e, null);
        clearTokensAndGoLogin();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    // 그 외 에러는 그대로
    return Promise.reject(error);
  }
);
