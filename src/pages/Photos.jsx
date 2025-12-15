import React from "react";
import { Link, useLocation } from "react-router-dom";
import { loadState, saveState, uid } from "../lib/store";

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export default function Photos() {
  const q = useQuery();
  const caseId = q.get("caseId") || "";
  const [state, setState] = React.useState(loadState());
  const [selectedCaseId, setSelectedCaseId] = React.useState(caseId);
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    setSelectedCaseId(caseId);
  }, [caseId]);

  function refresh() { setState(loadState()); }

  async function onPickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!selectedCaseId) return alert("먼저 설치건을 선택해줘.");

    const reader = new FileReader();
    reader.onload = () => {
      const s = loadState();
      s.photos.unshift({
        id: uid("photo"),
        caseId: selectedCaseId,
        dataUrl: reader.result,
        note: note.trim(),
        createdAt: new Date().toISOString()
      });
      saveState(s);
      setNote("");
      refresh();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function removePhoto(id) {
    const s = loadState();
    s.photos = s.photos.filter(p => p.id !== id);
    saveState(s);
    refresh();
  }

  const cases = state.cases;
  const filtered = selectedCaseId
    ? state.photos.filter(p => p.caseId === selectedCaseId)
    : state.photos;

  return (
    <div style={{maxWidth:900, margin:"24px auto", padding:16}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <h2>사진</h2>
        <Link to="/"><button>← 대시보드</button></Link>
      </div>

      <div style={{display:"grid", gap:8, marginTop:12}}>
        <label>설치건 선택</label>
        <select value={selectedCaseId} onChange={(e)=>setSelectedCaseId(e.target.value)} style={{padding:10}}>
          <option value="">(선택) 전체 보기</option>
          {cases.map(c => <option key={c.id} value={c.id}>{c.name} | {c.address}</option>)}
        </select>

        <input value={note} onChange={e=>setNote(e.target.value)} placeholder="사진 메모(선택)" style={{padding:10}} />
        <input type="file" accept="image/*" onChange={onPickFile} />
        <div style={{opacity:.7, fontSize:13}}>
          * 이 버전은 사진을 LocalStorage에 저장해서 용량이 크면 느려질 수 있어. 다음에 Supabase Storage로 옮길 거야.
        </div>
      </div>

      <h3 style={{marginTop:18}}>
        {selectedCaseId ? "설치건별 사진만 보기" : "전체 사진"}
      </h3>

      {filtered.length === 0 && <div style={{opacity:.7}}>사진이 없어.</div>}

      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:12}}>
        {filtered.map(p => (
          <div key={p.id} style={{border:"1px solid #3333", borderRadius:8, padding:10}}>
            <img src={p.dataUrl} alt="" style={{width:"100%", borderRadius:6}} />
            {p.note && <div style={{marginTop:6}}>{p.note}</div>}
            <button onClick={()=>removePhoto(p.id)} style={{marginTop:8}}>삭제</button>
          </div>
        ))}
      </div>
    </div>
  );
}
