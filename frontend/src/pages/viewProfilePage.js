import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router"; // ✅ location 추가
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

export default function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null); // { id, nickname, createdAt }
  const [isSelf, setIsSelf] = useState(true);   // ✅ 내 프로필인지 여부

  useEffect(() => {
    const myUid = window.localStorage.getItem("userid");
    if (!myUid) {
      // 로그인 필요 시
      navigate("/login");
      return;
    }

    // 쿼리에서 sid 추출 (없으면 내 uid)
    const qs = new URLSearchParams(location.search);
    const sid = (qs.get("sid") || "").trim();
    const targetId = sid || myUid;

    setIsSelf(targetId === myUid); // ✅ 자기 자신인지 판별

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

  // ✅ 활동 패널 라벨 (내 프로필/타인 프로필)
  const activityLabels = isSelf
    ? { posts: "내 게시글", comments: "내 댓글", scraps: "내 스크랩" }
    : { posts: "작성한 게시글", comments: "작성한 댓글", scraps: "스크랩" };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* 상단 프로필 카드 */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start gap-6">
          {/* 아바타 */}
          {loading ? (
            <Skeleton className="w-28 h-28 rounded-xl" />
          ) : (
            <div className="w-28 h-28 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
              <span className="text-lg font-bold text-gray-600">COPOTO</span>
            </div>
          )}

          {/* 기본 정보 */}
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
                <div className="mt-0.5 text-sm text-gray-500">
                  계정 생성 날짜 : {joinDate}
                </div>

                {/* 액션: 내 프로필일 때만 노출 ✅ */}
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
                      onClick={() => navigate("/settings/profile")}
                      className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold border border-gray-200"
                    >
                      프로필 편집 (지금은 누르면 터짐)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 정보 & 활동 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측: 계정 정보 카드 */}
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
                <button
                  onClick={() => navigate("/dashboards/notice")}
                  className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
                >
                  공지사항
                </button>
                <button
                  onClick={() => navigate("/dashboards/free")}
                  className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
                >
                  자유게시판
                </button>
                <button
                  onClick={() => navigate("/dashboards/qna")}
                  className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
                >
                  Q&A
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 우측: 활동 패널 */}
        <div className="lg:col-span-2">
          <ProfileActivityPanel
            userId={profile?.id}
            isSelf={isSelf}                     // ✅ 필요하면 내부에서 분기
            labels={activityLabels}             // ✅ 문구 전달: {posts, comments, scraps}
          />
        </div>
      </div>
    </div>
  );
}
