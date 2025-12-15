import React from "react";
import { loadState, saveState } from "../lib/store";

export default function PinGate({ children }) {
  const [pin, setPin] = React.useState("");
  const [pin2, setPin2] = React.useState("");
  const [err, setErr] = React.useState("");
  const [ok, setOk] = React.useState(false);

  React.useEffect(() => {
    const s = loadState();
    // PIN이 없으면 설정 화면, 있으면 입력 화면
    if (!s.pinHash) setOk(false);
  }, []);

  function submit() {
    const s = loadState();
    setErr("");

    if (!s.pinHash) {
      // 최초 설정
      if (pin.length < 4) return setErr("PIN은 4자리 이상으로 해줘.");
      if (pin !== pin2) return setErr("PIN이 서로 달라.");
      s.pinHash = pin; // 간단버전(나중에 해시로 강화 가능)
      saveState(s);
      setOk(true);
      setPin(""); setPin2("");
      return;
    }

    // 잠금 해제
    if (pin === s.pinHash) {
      setOk(true);
      setPin("");
    } else {
      setErr("PIN이 틀렸어.");
    }
  }

  if (ok) return children;

  const s = loadState();
  const isFirst = !s.pinHash;

  return (
    <div style={{maxWidth:420, margin:"60px auto", padding:16}}>
      <h2>LINEPD 현장형 고객관리</h2>
      <p style={{opacity:.8}}>
        {isFirst ? "처음 사용: PIN을 설정해줘" : "PIN 입력"}
      </p>

      <input
        value={pin}
        onChange={(e)=>setPin(e.target.value)}
        placeholder="PIN"
        type="password"
        style={{width:"100%", padding:12, fontSize:16, marginTop:8}}
      />

      {isFirst && (
        <input
          value={pin2}
          onChange={(e)=>setPin2(e.target.value)}
          placeholder="PIN 확인"
          type="password"
          style={{width:"100%", padding:12, fontSize:16, marginTop:8}}
        />
      )}

      {err && <div style={{color:"crimson", marginTop:10}}>{err}</div>}

      <button
        onClick={submit}
        style={{width:"100%", padding:12, marginTop:12, fontSize:16}}
      >
        {isFirst ? "PIN 설정" : "잠금 해제"}
      </button>
    </div>
  );
}
