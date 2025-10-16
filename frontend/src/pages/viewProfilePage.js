// ProfilePage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { api } from "../lib/api";
import ProfileActivityPanel from "../components/ProfileActivityPanel";

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

function formatDateKR(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ----------------- ✨ 편집 모달 ----------------- */
function EditProfileModal({ onClose, onNicknameUpdated }) {
  const [nick, setNick] = useState("");
  const [nickMsg, setNickMsg] = useState("");
  const [nickBusy, setNickBusy] = useState(false);

  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  // 닉네임 변경
  const submitNickname = async (e) => {
    e?.preventDefault();
    const trimmed = nick.trim();
    if (!trimmed) {
      setNickMsg("닉네임을 입력하세요.");
      return;
    }
    try {
      setNickBusy(true);
      setNickMsg("");
      const res = await api.put("/user/profile/nickname", { nickname: trimmed });
      // 성공: 상위 프로필 갱신
      onNicknameUpdated?.(res?.data?.data?.nickname ?? trimmed);
      setNickMsg("닉네임이 변경되었습니다.");
    } catch (err) {
      const s = err?.response?.status;
      const fallback = err?.response?.data?.message;
      const msg =
        s === 400 ? "닉네임을 입력하세요."
      : s === 401 ? "잘못된 비밀번호입니다."
      : s === 403 ? "닉네임에 혐오 표현이 포함되어 있어 변경할 수 없습니다."
      : s === 405 ? "현재와 동일한 닉네임은 사용할 수 없습니다."
      : s === 409 ? "이미 사용 중인 닉네임입니다."
      : fallback || "닉네임 변경 중 오류가 발생했습니다.";
      setNickMsg(msg);
    } finally {
      setNickBusy(false);
    }
  };

  // 비밀번호 변경
  const submitPassword = async (e) => {
    e?.preventDefault();
    if (!oldPw || !newPw || !newPw2) {
      setPwMsg("모든 비밀번호 칸을 입력하세요.");
      return;
    }
    if (newPw !== newPw2) {
      setPwMsg("새 비밀번호가 서로 일치하지 않습니다.");
      return;
    }
    if (oldPw === newPw) {
      setPwMsg("현재 비밀번호와 동일한 비밀번호로는 변경할 수 없습니다.");
      return; // ❗ API 호출 안 함
    }
    try {
      setPwBusy(true);
      setPwMsg("");
      await api.put("/user/profile/password", { oldPassword: oldPw, newPassword: newPw });
      setPwMsg("비밀번호가 변경되었습니다.");
      setOldPw(""); setNewPw(""); setNewPw2("");
    } catch (err) {
      const s = err?.response?.status;
      const fallback = err?.response?.data?.message;
      const msg =
        s === 400 ? "새 비밀번호/현재 비밀번호가 필요합니다."
      : s === 401 ? "비밀번호가 일치하지 않습니다."
      : s === 403 ? "현재 비밀번호가 일치하지 않습니다."
      : fallback || "비밀번호 변경 중 오류가 발생했습니다.";
      setPwMsg(msg);
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-base font-semibold">프로필 편집</h3>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
            aria-label="close"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* 닉네임 변경 */}
          <section>
            <h4 className="text-sm font-semibold mb-2">닉네임 변경</h4>
            <form onSubmit={submitNickname} className="flex gap-2">
              <input
                type="text"
                placeholder="새 닉네임"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                disabled={nickBusy}
              />
              <button
                type="submit"
                disabled={nickBusy || !nick.trim()}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white ${nickBusy || !nick.trim() ? "bg-blue-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"}`}
              >
                변경
              </button>
            </form>
            {nickMsg && (
              <p className={`mt-2 text-sm ${/변경되었습니다|완료/.test(nickMsg) ? "text-green-600" : "text-red-600"}`}>
                {nickMsg}
              </p>
            )}
          </section>

          {/* 비밀번호 변경 */}
          <section>
            <h4 className="text-sm font-semibold mb-2">비밀번호 변경</h4>
            <form onSubmit={submitPassword} className="space-y-2">
              <input
                type="password"
                placeholder="현재 비밀번호"
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                value={oldPw}
                onChange={(e) => setOldPw(e.target.value)}
                disabled={pwBusy}
              />
              <input
                type="password"
                placeholder="새 비밀번호"
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                disabled={pwBusy}
              />
              <input
                type="password"
                placeholder="새 비밀번호 확인"
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                value={newPw2}
                onChange={(e) => setNewPw2(e.target.value)}
                disabled={pwBusy}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={pwBusy}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold text-white ${pwBusy ? "bg-blue-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"}`}
                >
                  변경
                </button>
              </div>
            </form>
            {pwMsg && (
              <p className={`mt-2 text-sm ${/변경되었습니다/.test(pwMsg) ? "text-green-600" : "text-red-600"}`}>
                {pwMsg}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
/* ----------------- ✨ 편집 모달 끝 ----------------- */

export default function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null); // { id, nickname, createdAt }
  const [isSelf, setIsSelf] = useState(true);
  const [showEdit, setShowEdit] = useState(false); // ✅ 모달 열림 상태

  useEffect(() => {
    const myUid = window.localStorage.getItem("userid");
    if (!myUid) {
      navigate("/login");
      return;
    }
    const qs = new URLSearchParams(location.search);
    const sid = (qs.get("sid") || "").trim();
    const targetId = sid || myUid;
    setIsSelf(targetId === myUid);

    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/user/profile/${encodeURIComponent(targetId)}`);
        const data = res?.data?.data || {};
        if (!mounted) return;
        setProfile({
          id: targetId,
          nickname: data.nickname ?? "",
          createdAt: data.createdAt ?? "",
        });
      } catch (e) {
        console.error("프로필 로드 실패:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [location.search, navigate]);

  const joinDate = formatDateKR(profile?.createdAt);
  const activityLabels = isSelf
    ? { posts: "내 게시글", comments: "내 댓글", scraps: "내 스크랩" }
    : { posts: "작성한 게시글", comments: "작성한 댓글", scraps: "스크랩" };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start gap-6">
          {loading ? (
            <Skeleton className="w-28 h-28 rounded-xl" />
          ) : (
            <div className="w-28 h-28 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
              <span className="text-lg font-bold text-gray-600">COPOTO</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            {loading ? (
              <>
                <Skeleton className="w-48 h-6 mb-2" />
                <Skeleton className="w-72 h-4 mb-1" />
                <Skeleton className="w-64 h-4" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900 truncate">
                    {profile?.nickname || profile?.id || "사용자"}
                  </h1>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    일반회원
                  </span>
                </div>

                <div className="mt-1 text-sm text-gray-600">
                  아이디 : <span className="font-medium">{profile?.id}</span>
                </div>
                <div className="mt-0.5 text-sm text-gray-500">계정 생성 날짜 : {joinDate}</div>

                {isSelf && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        navigate(
                          `/createpost?boardType=${localStorage.getItem("currentBoard") || "free"}`
                        )
                      }
                      className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                    >
                      새 글 쓰기
                    </button>
                    <button
                      onClick={() => setShowEdit(true)}  // ✅ 모달 열기
                      className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold border border-gray-200"
                    >
                      프로필 편집
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">계정 정보</h2>
            {loading ? (
              <>
                <Skeleton className="h-4 w-40 mb-2" />
                <Skeleton className="h-4 w-52 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-center justify-between">
                  <span className="text-gray-500">닉네임</span>
                  <span className="font-medium">{profile?.nickname || "-"}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-gray-500">아이디</span>
                  <span className="font-medium">{profile?.id}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-gray-500">권한</span>
                  <span className="font-medium">일반회원</span>
                </li>
              </ul>
            )}

            <div className="mt-5 border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">빠른 이동</h3>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => navigate("/dashboards/notice")} className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50">
                  공지사항
                </button>
                <button onClick={() => navigate("/dashboards/free")} className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50">
                  자유게시판
                </button>
                <button onClick={() => navigate("/dashboards/qna")} className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50">
                  Q&A
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <ProfileActivityPanel userId={profile?.id} isSelf={isSelf} labels={activityLabels} />
        </div>
      </div>

      {/* ✨ 편집 모달 mount */}
      {showEdit && (
        <EditProfileModal
          onClose={() => setShowEdit(false)}
          onNicknameUpdated={(newNick) => setProfile((p) => ({ ...p, nickname: newNick }))}
        />
      )}
    </div>
  );
}
