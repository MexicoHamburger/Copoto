// components/ProfileEditPopup.jsx
import { useState } from "react";
import { api } from "../lib/api";

// 회원가입과 동일한 규칙: 8자 이상 + 특수문자 1개 이상( _ @ $ ! % ? & )
const PASSWORD_RULE = /^(?=.*[_@$!%?&])[A-Za-z\d_@$!%?&]{8,}$/;

function checkNewPassword(oldPwd, newPwd, newPwd2) {
  if (!newPwd) return "새 비밀번호를 입력하세요.";
  if (!PASSWORD_RULE.test(newPwd))
    return "비밀번호는 8자 이상이며 특수문자 1개 이상( _ @ $ ! % ? & )을 포함해야 합니다.";
  if (oldPwd && newPwd === oldPwd)
    return "현재 비밀번호와 새 비밀번호가 같습니다.";
  if (!newPwd2) return "새 비밀번호 확인을 입력하세요.";
  if (newPwd !== newPwd2) return "새 비밀번호가 서로 다릅니다.";
  return null;
}

export default function ProfileEditPopup({ defaultNickname = "", onClose, onNicknameUpdated }) {
  // 닉네임
  const [nick, setNick] = useState(defaultNickname);
  const [nickMsg, setNickMsg] = useState("");
  const [nickBusy, setNickBusy] = useState(false);

  // 비밀번호
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // 닉네임 변경
  const submitNickname = async () => {
    const trimmed = nick.trim();
    if (!trimmed) { setNickMsg("닉네임을 입력하세요."); return; }

    try {
      setNickBusy(true);
      setNickMsg("");
      const res = await api.put("/user/profile/nickname", { nickname: trimmed });
      const updated = res?.data?.data?.nickname ?? trimmed;
      onNicknameUpdated?.(updated);
      setNickMsg("닉네임이 변경되었습니다.");
    } catch (e) {
      const s = e?.response?.status;
      const msg =
        s === 400 ? "닉네임을 입력하세요."
        : s === 401 ? "로그인이 필요합니다."
        : s === 403 ? (e?.response?.data?.message || "닉네임에 혐오 표현이 포함되어 있어 변경할 수 없습니다.")
        : s === 405 ? "현재와 동일한 닉네임은 사용할 수 없습니다."
        : s === 409 ? "이미 사용 중인 닉네임입니다."
        : "닉네임 변경 중 오류가 발생했습니다.";
      setNickMsg(msg);
    } finally {
      setNickBusy(false);
    }
  };

  // 비밀번호 변경
  const submitPassword = async () => {
    const err = checkNewPassword(oldPwd, newPwd, newPwd2);
    if (err) { setPwdMsg(err); return; }

    try {
      setPwdBusy(true);
      setPwdMsg("");
      await api.put("/user/profile/password", {
        oldPassword: oldPwd,
        newPassword: newPwd,
      });
      setPwdMsg("비밀번호가 변경되었습니다.");
      setOldPwd(""); setNewPwd(""); setNewPwd2("");
    } catch (e) {
      const s = e?.response?.status;
      const msg =
        s === 400 ? "현재/새 비밀번호를 모두 입력하세요."
        : s === (401 || 403) ? "비밀번호가 틀렸습니다."
        : "비밀번호 변경 중 오류가 발생했습니다.";
      setPwdMsg(msg);
    } finally {
      setPwdBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-base font-semibold">프로필 편집</h3>
          <button
            className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            닫기 ✕
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* 닉네임 섹션 */}
          <section>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">닉네임 변경</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={nick}
                onChange={(e) => { setNick(e.target.value); setNickMsg(""); }}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                placeholder="새 닉네임"
                disabled={nickBusy}
              />
              <button
                onClick={submitNickname}
                disabled={nickBusy || !nick.trim()}
                className={
                  "px-4 py-2 rounded-lg text-white text-sm font-semibold " +
                  (nickBusy || !nick.trim() ? "bg-blue-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600")
                }
              >
                변경
              </button>
            </div>
            {nickMsg && <p className={"mt-2 text-sm " + (/변경되었습니다|완료/.test(nickMsg) ? "text-green-600" : "text-red-600")}>{nickMsg}</p>}
          </section>

          {/* 비밀번호 섹션 */}
          <section>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">비밀번호 변경</h4>
            <div className="space-y-2">
              <input
                type={showPwd ? "text" : "password"}
                value={oldPwd}
                onChange={(e) => { setOldPwd(e.target.value); setPwdMsg(""); }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="현재 비밀번호"
                disabled={pwdBusy}
              />
              <input
                type={showPwd ? "text" : "password"}
                value={newPwd}
                onChange={(e) => { setNewPwd(e.target.value); setPwdMsg(""); }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="새 비밀번호 (8자+, 특수문자 1개 이상)"
                disabled={pwdBusy}
              />
              <input
                type={showPwd ? "text" : "password"}
                value={newPwd2}
                onChange={(e) => { setNewPwd2(e.target.value); setPwdMsg(""); }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="새 비밀번호 확인"
                disabled={pwdBusy}
              />

              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-600 flex items-center gap-2">
                  <input type="checkbox" checked={showPwd} onChange={(e) => setShowPwd(e.target.checked)} />
                  비밀번호 보기
                </label>
                <button
                  onClick={submitPassword}
                  disabled={pwdBusy}
                  className={
                    "px-4 py-2 rounded-lg text-white text-sm font-semibold " +
                    (pwdBusy ? "bg-blue-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600")
                  }
                >
                  변경
                </button>
              </div>

              {/* 즉석 안내 */}
              <p className="text-xs text-gray-500 mt-1">
                규칙: 8자 이상, 특수문자 1개 이상 포함 (사용 가능: _ @ $ ! % ? &)
              </p>
              {pwdMsg && <p className={"mt-2 text-sm " + (/변경되었습니다|완료/.test(pwdMsg) ? "text-green-600" : "text-red-600")}>{pwdMsg}</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
