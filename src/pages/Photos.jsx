import React from "react";
import { useLocation, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Photos() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const jobId = params.get("jobId");
  const changeId = params.get("changeId");

  const isChange = !!changeId;

  const [photos, setPhotos] = React.useState([]);
  const [uploading, setUploading] = React.useState(false);

  async function load() {
    const table = isChange ? "job_change_photos" : "job_photos";
    const column = isChange ? "change_id" : "job_id";

    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq(column, isChange ? changeId : jobId)
      .order("created_at", { ascending: false });

    if (error) alert(error.message);
    else setPhotos(data || []);
  }

  React.useEffect(() => {
    load();
  }, [jobId, changeId]);

  async function upload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}.${ext}`;
    const path = isChange
      ? `changes/${changeId}/${fileName}`
      : `jobs/${jobId}/${fileName}`;

    const { error: upErr } = await supabase.storage
      .from("photos")
      .upload(path, file);

    if (upErr) {
      alert(upErr.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("photos").getPublicUrl(path);

    const table = isChange ? "job_change_photos" : "job_photos";
    const payload = isChange
      ? { change_id: changeId, url: data.publicUrl }
      : { job_id: jobId, url: data.publicUrl };

    const { error } = await supabase.from(table).insert(payload);

    if (error) alert(error.message);

    setUploading(false);
    load();
  }

  async function remove(photo) {
    if (!confirm("이 사진을 삭제할까?")) return;

    const path = photo.url.split("/storage/v1/object/public/photos/")[1];
    await supabase.storage.from("photos").remove([path]);

    const table = isChange ? "job_change_photos" : "job_photos";
    await supabase.from(table).delete().eq("id", photo.id);

    load();
  }

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>{isChange ? "변동건 사진" : "설치건 사진"}</h2>
        <Link to="/cases">
          <button>← 돌아가기</button>
        </Link>
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={upload}
        disabled={uploading}
        style={{ marginBottom: 12 }}
      />

      {uploading && <div>업로드 중…</div>}
      {!uploading && photos.length === 0 && <div>사진이 없어.</div>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 10,
        }}
      >
        {photos.map((p) => (
          <div key={p.id} style={{ position: "relative" }}>
            <img
              src={p.url}
              alt=""
              style={{
                width: "100%",
                height: 120,
                objectFit: "cover",
                borderRadius: 6,
              }}
            />
            <button
              onClick={() => remove(p)}
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
