import React from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div style={{maxWidth:900, margin:"24px auto", padding:16}}>
      <h2>대시보드</h2>
      <div style={{display:"flex", gap:12, marginTop:12, flexWrap:"wrap"}}>
        <Link to="/cases"><button style={{padding:12}}>설치건 관리</button></Link>
        <Link to="/photos"><button style={{padding:12}}>사진</button></Link>
      </div>
      <p style={{marginTop:18, opacity:.75}}>
        지금 버전은 로컬저장(LocalStorage)으로 동작해. 다음 단계에서 Supabase로 “진짜 저장” 연결할 거야.
      </p>
    </div>
  );
}
