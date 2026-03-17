const SUPABASE_URL = "https://ewncpxwxgsxgmpmsdsfd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bmNweHd4Z3N4Z21wbXNkc2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjIwNDEsImV4cCI6MjA4OTI5ODA0MX0.EZWZNL86U-DQfWE3v-XMHqigZWHRLzDlE-lrqNGwJ2k";

async function fetchAPI(endpoint, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    };
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) throw new Error(`DB 에러: ${response.status}`);
    return response.status === 204 ? null : await response.json();
}

async function getData(table, params = {}) {
    let query = "";
    if (params.id) query = `?id=eq.${params.id}`;
    return await fetchAPI(table + query);
}

async function getRecord(table, id) {
    const data = await getData(table, { id });
    return (data && data.length > 0) ? data[0] : null;
}

async function createData(table, data) {
    return await fetchAPI(table, { method: 'POST', body: JSON.stringify(data) });
}

async function updateData(table, id, data) {
    return await fetchAPI(`${table}?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

async function deleteData(table, id) {
    return await fetchAPI(`${table}?id=eq.${id}`, { method: 'DELETE' });
}

// 원본 유틸리티 함수들
function showLoading(id) { const c = document.getElementById(id); if(c) c.innerHTML = '<div class="loading"></div>'; }
function showError(id, m) { const c = document.getElementById(id); if(c) c.innerHTML = `<div class="error-box">${m}</div>`; }
function showModal(id) { const m = document.getElementById(id); if(m) m.style.display = 'block'; }
function hideModal(id) { const m = document.getElementById(id); if(m) m.style.display = 'none'; }
function formatDateDisplay(s) { if(!s) return ''; const d = new Date(s); return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`; }
function generateUUID() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => (c=='x'?Math.random()*16|0:(Math.random()*16|0&0x3|0x8)).toString(16)); }
