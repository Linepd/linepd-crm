import React from "react";
import { loadState, saveState, uid } from "../lib/store";
import { Link } from "react-router-dom";

export default function Cases() {
  const [state, setState] = React.useState(loadState());
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [memo, setMemo] = React.useState("");
  const [cost, setCost] = React.useState("");

  function refresh() { setState(loadState()); }

  function addCase() {
    const s = loadState();
    const item = {
      id: uid("case"),
      name: name.trim(),
      address: address.trim(),
      memo: memo.trim(),
      cost: Number(cost || 0),
      createdAt: new Date().toISOString()
    };
    if (!item.name) return alert("상호를 입력해줘.");
    s.cases.unshift(item);
    saveState(s);
    setName(""); setAddress(""); setMemo(""); setCost("");
    refresh();
  }

  function removeCase(id) {
    const s = loadState();
    s.cases = s.cases.filter(c => c.id !== id);
    // 해당 설치건 사진도 같이 삭제
    s.photos = s.photos.filter(p => p.caseId !== id);
    saveState(s);
    refresh();
  }

  return (
    <div style={{maxWidth:900, margin:"24px auto", padding:16}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <h2>설치건</h2>
        <Link to="/"><button>← 대시보드</button></Link>
      </div>

      <div style={{border:"1px solid #3333", padding:12, borderRadius:8, marginTop:12}}>
        <h3 style={{marginTop:0}}>새 설치건</h3>
        <div style={{display:"grid", gap:8}}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="상호(고객명)" style={{padding:10}} />
          <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="주소" style={{padding:10}} />
          <input value={memo} onChange={e=>setMemo(e.target.value)} placeholder="메모" style={{padding:10}} />
          <input value={cost} onChange={e=>setCost(e.target.value)} placeholder="설치비용(원)" inputMode="numeric" style={{padding:10}} />
          <button onClick={addCase} style={{padding:10}}>추가</button>
        </div>
      </div>

      <h3 style={{marginTop:18}}>목록</h3>
      {state.cases.length === 0 && <div style={{opacity:.7}}>아직 설치건이 없어.</div>}

      <div style={{display:"grid", gap:10}}>
        {state.cases.map(c => (
          <div key={c.id} style={{border:"1px solid #3333", padding:12, borderRadius:8}}>
            <div style={{display:"flex", justifyContent:"space-between", gap:10}}>
              <div>
                <div style={{fontWeight:700}}>{c.name}</div>
                <div style={{opacity:.8}}>{c.address}</div>
                {c.memo && <div style={{marginTop:6}}>{c.memo}</div>}
                <div style={{marginTop:6}}>설치비용: <b>{(c.cost||0).toLocaleString()}</b> 원</div>
                <div style={{marginTop:6}}>
                  <Link to={`/photos?caseId=${encodeURIComponent(c.id)}`}>
                    설치건별 사진 보기 →
                  </Link>
                </div>
              </div>
              <button onClick={()=>removeCase(c.id)} style={{height:40}}>삭제</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
