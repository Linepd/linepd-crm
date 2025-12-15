import React from "react";

const SESSION_KEY = "linepd_pin_unlocked";

export default function PinGate({ children }) {
  const [pin, setPin] = React.useState("");
  const [savedPin, setSavedPin] = React.useState(
    localStorage.getItem("linepd_pin") || ""
  );
  const [unlocked, setUnlocked] = React.useState(
    sessionStorage.getItem(SESSION_KEY) === "1"
  );

  function savePin() {
    if (pin.length < 4) return alert("PIN은 최소 4자리야.");
    localStorage.setItem("linepd_pin", pin);
    sessionStorage.setItem(SESSION_KEY, "1");
    setSavedPin(pin);
    setUnlocked(true);
  }

  function unlock() {
    if (pin === savedPin) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setUnlocked(true);
    } else {
      alert("PIN이 틀렸어.");
    }
  }

  if (unlocked) return children;

  return (
    <div style={{ maxWidth: 360, margin: "120px auto", textAlign: "center" }}>
      <h2>LINEPD 현장형 고객관리</h2>

      <input
        type="password"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        placeholder={savedPin ? "PIN 입력" : "PIN 설정"}
        style={{ padding: 12, fontSize: 18, width: "100%" }}
      />

      <button
        onClick={savedPin ? unlock : savePin}
        style={{ marginTop: 12, padding: 12, width: "100%" }}
      >
        {savedPin ? "잠금 해제" : "PIN 저장"}
      </button>

      <div style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
        새로고침해도 유지 · 브라우저 닫으면 다시 잠금
      </div>
    </div>
  );
}
