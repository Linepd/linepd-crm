import React from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

const today = () => new Date().toISOString().slice(0, 10);

// 📥 엑셀(CSV) 출력 – UTF-8 BOM 포함(한글 안깨짐) / 사진 제외
function exportExcel(jobs, changesByJob) {
  const header = ["설치일", "고객명", "전화번호", "주소", "기본설치비", "추가설치비", "총액", "메모"];

  const rows = jobs.map((j) => {
    const extra =
      (changesByJob[j.id] || [])
        .filter((x) => !x.is_deleted)
        .reduce((s, x) => s + Number(x.extra_cost || 0), 0) || 0;

    return [
      j.install_date || "",
      j.name || "",
      j.phone || "",
      j.address || "",
      Number(j.total || 0),
      extra,
      Number(j.total || 0) + extra,
      j.memo || "",
    ];
  });

  const csvBody = [header, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const csv = "\uFEFF" + csvBody;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `LINEPD_설치건_${today()}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}

export default function Cases() {
  const [jobs, setJobs] = React.useState([]);
  const [changesByJob, setChangesByJob] = React.useState({});
  const [loading, setLoading] = React.useState(true);

  const [keyword, setKeyword] = React.useState("");

  // 휴지통 보기(설치건)
  const [showTrashJobs, setShowTrashJobs] = React.useState(false);
  // 변동건 휴지통 보기(설치건별 토글)
  const [showTrashChanges, setShowTrashChanges] = React.useState({}); // { [jobId]: boolean }

  // 신규 설치건
  const [installDate, setInstallDate] = React.useState(today());
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [memo, setMemo] = React.useState("");
  const [total, setTotal] = React.useState("");

  // 변동건 입력 상태
  const [changeInputs, setChangeInputs] = React.useState({});
  const getCI = (jobId) => changeInputs[jobId] || { date: today(), desc: "", cost: "" };
  const setCI = (jobId, patch) =>
    setChangeInputs((p) => ({ ...p, [jobId]: { ...getCI(jobId), ...patch } }));

  async function load() {
    setLoading(true);

    const { data: j, error: je } = await supabase
      .from("jobs")
      .select("*")
      .order("install_date", { ascending: false });

    if (je) {
      setLoading(false);
      return alert(je.message);
    }

    const { data: c, error: ce } = await supabase.from("job_changes").select("*");
    if (ce) {
      setLoading(false);
      return alert(ce.message);
    }

    const cg = {};
    (c || []).forEach((x) => {
      if (!cg[x.job_id]) cg[x.job_id] = [];
      cg[x.job_id].push(x);
    });

    setJobs(j || []);
    setChangesByJob(cg);
    setLoading(false);
  }

  React.useEffect(() => {
    load();
  }, []);

  // ---------------------------
  // 설치건 CRUD
  // ---------------------------
  async function addJob() {
    if (!name.trim()) return alert("고객명 입력.");

    const { error } = await supabase.from("jobs").insert({
      install_date: installDate,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      memo: memo.trim(),
      total: Number(total || 0),
      is_deleted: false,
    });

    if (error) return alert(error.message);

    setInstallDate(today());
    setName("");
    setPhone("");
    setAddress("");
    setMemo("");
    setTotal("");
    load();
  }

  const updateInstallDate = (id, v) =>
    supabase.from("jobs").update({ install_date: v }).eq("id", id).then(({ error }) => {
      if (error) alert(error.message);
      else load();
    });

  const updateTotal = (id, v) =>
    supabase.from("jobs").update({ total: Number(v || 0) }).eq("id", id).then(({ error }) => {
      if (error) alert(error.message);
      else load();
    });

  // 설치건: 휴지통 이동
  async function trashJob(id) {
    if (!confirm("이 설치건을 삭제(휴지통 이동)할까?\n※ 복구 가능")) return;
    const { error } = await supabase.from("jobs").update({ is_deleted: true }).eq("id", id);
    if (error) alert(error.message);
    else load();
  }

  // 설치건: 복구
  async function restoreJob(id) {
    const { error } = await supabase.from("jobs").update({ is_deleted: false }).eq("id", id);
    if (error) alert(error.message);
    else load();
  }

  // 설치건 휴지통 비우기(영구 삭제)
  async function emptyJobTrash() {
    if (!confirm("휴지통(삭제된 설치건)을 전부 영구 삭제할까?\n※ 복구 불가")) return;
    const { error } = await supabase.from("jobs").delete().eq("is_deleted", true);
    if (error) alert(error.message);
    else load();
  }

  // ---------------------------
  // 변동건 CRUD (삭제/복구 포함)
  // ---------------------------
  async function addChange(jobId) {
    const c = getCI(jobId);
    if (!c.desc.trim()) return alert("변동 내용을 입력해줘.");

    const { error } = await supabase.from("job_changes").insert({
      job_id: jobId,
      change_date: c.date,
      description: c.desc.trim(),
      extra_cost: Number(c.cost || 0),
      is_deleted: false,
    });

    if (error) return alert(error.message);

    setCI(jobId, { date: today(), desc: "", cost: "" });
    load();
  }

  const updateChange = (id, patch) =>
    supabase.from("job_changes").update(patch).eq("id", id).then(({ error }) => {
      if (error) alert(error.message);
      else load();
    });

  async function trashChange(id) {
    if (!confirm("이 변동건을 삭제(휴지통 이동)할까?\n※ 복구 가능")) return;
    const { error } = await supabase.from("job_changes").update({ is_deleted: true }).eq("id", id);
    if (error) alert(error.message);
    else load();
  }

  async function restoreChange(id) {
    const { error } = await supabase.from("job_changes").update({ is_deleted: false }).eq("id", id);
    if (error) alert(error.message);
    else load();
  }

  async function emptyChangeTrashForJob(jobId) {
    if (!confirm("이 설치건의 삭제된 변동건을 전부 영구 삭제할까?\n※ 복구 불가")) return;
    const { error } = await supabase
      .from("job_changes")
      .delete()
      .eq("job_id", jobId)
      .eq("is_deleted", true);

    if (error) alert(error.message);
    else load();
  }

  // ---------------------------
  // 계산/필터
  // ---------------------------
  const extraSum = (jobId) =>
    (changesByJob[jobId] || [])
      .filter((x) => !x.is_deleted)
      .reduce((s, x) => s + Number(x.extra_cost || 0), 0);

  const jobsShown = jobs
    .filter((j) => (showTrashJobs ? j.is_deleted === true : j.is_deleted !== true))
    .filter((j) => {
      if (!keyword.trim()) return true;
      const k = keyword.toLowerCase();
      return (j.name || "").toLowerCase().includes(k) || (j.phone || "").includes(k);
    });

  const toggleChangeTrash = (jobId) =>
    setShowTrashChanges((p) => ({ ...p, [jobId]: !p[jobId] }));

  return (
    <div style={{ maxWidth: 980, margin: "24px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>📡 LINEPD 설치관리</h2>
        <Link to="/"><button style={{ padding: "8px 12px" }}>← 대시보드</button></Link>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <button
          onClick={() => exportExcel(jobs.filter((j) => !j.is_deleted), changesByJob)}
          style={{ padding: "8px 12px", fontWeight: 700 }}
        >
          📥 엑셀 저장
        </button>

        <button
          onClick={() => setShowTrashJobs((v) => !v)}
          style={{ padding: "8px 12px" }}
        >
          {showTrashJobs ? "← 정상 목록" : "🗑 설치건 휴지통"}
        </button>

        {showTrashJobs && (
          <button
            onClick={emptyJobTrash}
            style={{ padding: "8px 12px", color: "white", background: "#b00020", border: "none", borderRadius: 6 }}
          >
            🧨 설치건 휴지통 비우기(영구 삭제)
          </button>
        )}
      </div>

      <input
        placeholder="고객명 또는 전화번호 검색"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        style={{ padding: 10, width: "100%", marginTop: 12 }}
      />

      {!showTrashJobs && (
        <div style={{ border: "1px solid #3333", padding: 12, borderRadius: 10, marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>➕ 신규설치</h3>
          <div style={{ display: "grid", gap: 8 }}>
            <input type="date" value={installDate} onChange={(e) => setInstallDate(e.target.value)} style={{ padding: 10 }} />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="고객명" style={{ padding: 10 }} />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="전화번호" inputMode="tel" style={{ padding: 10 }} />
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="주소" style={{ padding: 10 }} />
            <input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="메모" style={{ padding: 10 }} />
            <input value={total} onChange={(e) => setTotal(e.target.value)} placeholder="기본 설치비(원)" inputMode="numeric" style={{ padding: 10 }} />
            <button onClick={addJob} style={{ padding: 10, fontWeight: 700 }}>추가</button>
          </div>
        </div>
      )}

      <h3 style={{ marginTop: 16 }}>{showTrashJobs ? "🗑 삭제된 설치건" : "목록"}</h3>
      {loading && <div>불러오는 중…</div>}
      {!loading && jobsShown.length === 0 && <div>표시할 항목이 없어.</div>}

      <div style={{ display: "grid", gap: 10 }}>
        {jobsShown.map((j) => {
          const extra = extraSum(j.id);
          const grand = Number(j.total || 0) + extra;
          const ci = getCI(j.id);
          const showTrashC = !!showTrashChanges[j.id];

          const changesAll = changesByJob[j.id] || [];
          const changesShown = changesAll.filter((c) => (showTrashC ? c.is_deleted === true : c.is_deleted !== true));

          return (
            <div key={j.id} style={{ border: "1px solid #3333", padding: 12, borderRadius: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <div>📅</div>
                    <input
                      type="date"
                      value={j.install_date || today()}
                      disabled={showTrashJobs}
                      onChange={(e) => updateInstallDate(j.id, e.target.value)}
                      style={{ padding: 8 }}
                    />
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{j.name}</div>

                    {j.phone ? (
                      <a href={`tel:${j.phone}`} style={{ textDecoration: "none", fontWeight: 700, color: "#0066cc" }}>
                        ☎ {j.phone}
                      </a>
                    ) : (
                      <span style={{ color: "#999" }}>☎ -</span>
                    )}
                  </div>

                  {j.address && <div style={{ marginTop: 6 }}>{j.address}</div>}
                  {j.memo && <div style={{ marginTop: 6, opacity: 0.9 }}>{j.memo}</div>}

                  {!showTrashJobs && (
                    <>
                      <div style={{ marginTop: 8 }}>
                        기본 설치비:{" "}
                        <input
                          type="number"
                          value={j.total ?? 0}
                          onChange={(e) => updateTotal(j.id, e.target.value)}
                          style={{ padding: 6, width: 140 }}
                        />{" "}
                        원
                      </div>

                      <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
                        ➕ 추가설치비: {extra.toLocaleString()} 원<br />
                        💰 총액: {grand.toLocaleString()} 원
                      </div>

                      <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <Link to={`/photos?jobId=${encodeURIComponent(j.id)}`}>📸 설치건 사진 →</Link>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  {!showTrashJobs ? (
                    <button onClick={() => trashJob(j.id)} style={{ padding: "8px 12px", color: "white", background: "#b00020", border: "none", borderRadius: 6 }}>
                      삭제(휴지통)
                    </button>
                  ) : (
                    <button onClick={() => restoreJob(j.id)} style={{ padding: "8px 12px", fontWeight: 700 }}>
                      복구
                    </button>
                  )}
                </div>
              </div>

              {/* 변동건 */}
              {!showTrashJobs && (
                <div style={{ marginTop: 12, borderTop: "1px dashed #ccc", paddingTop: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <b>{showTrashC ? "🗑 삭제된 변동건" : "설치변동건"}</b>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button onClick={() => toggleChangeTrash(j.id)} style={{ padding: "6px 10px" }}>
                        {showTrashC ? "← 변동 정상 목록" : "🗑 변동 휴지통"}
                      </button>
                      {showTrashC && (
                        <button
                          onClick={() => emptyChangeTrashForJob(j.id)}
                          style={{ padding: "6px 10px", color: "white", background: "#b00020", border: "none", borderRadius: 6 }}
                        >
                          🧨 변동 휴지통 비우기(영구 삭제)
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                    {changesShown.length === 0 && (
                      <div style={{ fontSize: 13, opacity: 0.7 }}>
                        {showTrashC ? "삭제된 변동건이 없어." : "아직 변동건이 없어."}
                      </div>
                    )}

                    {changesShown.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "140px 1fr 140px auto auto",
                          gap: 6,
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="date"
                          value={c.change_date || today()}
                          disabled={c.is_deleted}
                          onChange={(e) => updateChange(c.id, { change_date: e.target.value })}
                          style={{ padding: 8 }}
                        />
                        <input
                          value={c.description || ""}
                          disabled={c.is_deleted}
                          onChange={(e) => updateChange(c.id, { description: e.target.value })}
                          style={{ padding: 8 }}
                        />
                        <input
                          type="number"
                          value={c.extra_cost ?? 0}
                          disabled={c.is_deleted}
                          onChange={(e) => updateChange(c.id, { extra_cost: Number(e.target.value || 0) })}
                          style={{ padding: 8 }}
                        />

                        {/* ✅ 변동건 사진 버튼 */}
                        {!c.is_deleted ? (
                          <Link
                            to={`/photos?changeId=${encodeURIComponent(c.id)}`}
                            style={{ textDecoration: "none" }}
                          >
                            <button style={{ padding: "6px 10px" }}>📸</button>
                          </Link>
                        ) : (
                          <button style={{ padding: "6px 10px" }} disabled>
                            📸
                          </button>
                        )}

                        {!c.is_deleted ? (
                          <button onClick={() => trashChange(c.id)} style={{ padding: "6px 10px" }}>
                            삭제
                          </button>
                        ) : (
                          <button onClick={() => restoreChange(c.id)} style={{ padding: "6px 10px", fontWeight: 700 }}>
                            복구
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 새 변동건 추가 */}
                  {!showTrashC && (
                    <div
                      style={{
                        marginTop: 10,
                        display: "grid",
                        gridTemplateColumns: "140px 1fr 140px auto",
                        gap: 6,
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="date"
                        value={ci.date}
                        onChange={(e) => setCI(j.id, { date: e.target.value })}
                        style={{ padding: 8 }}
                      />
                      <input
                        placeholder="변동 내용"
                        value={ci.desc}
                        onChange={(e) => setCI(j.id, { desc: e.target.value })}
                        style={{ padding: 8 }}
                      />
                      <input
                        placeholder="추가 설치비"
                        value={ci.cost}
                        onChange={(e) => setCI(j.id, { cost: e.target.value })}
                        inputMode="numeric"
                        style={{ padding: 8 }}
                      />
                      <button onClick={() => addChange(j.id)} style={{ padding: "8px 12px", fontWeight: 700 }}>
                        변동 추가
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
