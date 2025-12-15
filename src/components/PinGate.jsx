import React from "react";

const PIN_KEY = "linepd_pin_ok";
const PIN_VALUE = "1122"; // ← 여기 PIN 번호 바꾸면 됨

export default function PinGate({ children }) {
  const [ok, setOk] = React.useState(
    localStorage.getItem(PIN_KEY) === "yes"
  );
  const [pin, setPin] = React.useState("");

  function submit() {
    if (pin === PIN_VALUE) {
      localStorage.setItem(PIN_KEY, "yes");
      setOk(true);
    } else {
      alert("PIN 번호가 틀렸어");
      setPin("");
    }
  }

  if (ok) return children;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#111",
        color: "#fff",
      }}
    >
      <div style={{ width: 280, textAlign: "center" }}>
        <h2>🔒 LINEPD</h2>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN 입력"
          inputMode="numeric"
          style={{
            width: "100%",
            padding: 12,
            fontSize: 18,
            textAlign: "center",
          }}
        />
        <button
          onClick={submit}
          style={{
            width: "100%",
            marginTop: 12,
            padding: 12,
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          열기
        </button>
      </div>
    </div>
  );
}
