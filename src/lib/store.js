const KEY = "linepd_crm_v1";

const defaultState = {
  pinHash: null, // 간단버전: 실제 hash 대신 문자열로 저장(나중에 강화 가능)
  cases: [], // {id, name, address, memo, cost, createdAt}
  photos: [] // {id, caseId, dataUrl, note, createdAt}
};

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : defaultState;
  } catch {
    return defaultState;
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function uid(prefix="id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
