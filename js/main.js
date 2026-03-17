// Supabase 연결 정보
const SUPABASE_URL = "https://ewncpxwxgsxgmpmsdsfd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bmNweHd4Z3N4Z21wbXNkc2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjIwNDEsImV4cCI6MjA4OTI5ODA0MX0.EZWZNL86U-DQfWE3v-XMHqigZWHRLzDlE-lrqNGwJ2k";

// 공통 API 호출 함수 (Supabase REST API 방식)
async function fetchAPI(endpoint, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    };

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        const errorData = await response.json();
        console.error("DB 에러 상세:", errorData);
        throw new Error(`DB 연결 실패: ${response.status}`);
    }
    
    if (response.status === 204) return null;
    return await response.json();
}

// 데이터를 가져오는 함수 (Supabase는 결과가 바로 배열임)
async function getData(table, params = {}) {
    let query = "";
    if (params.id) {
        query = `?id=eq.${params.id}`;
    }
    // 기존 .data 제거를 위해 결과를 바로 반환
    return await fetchAPI(table + query);
}

// 단일 레코드 가져오기
async function getRecord(table, id) {
    const data = await getData(table, { id });
    return (data && data.length > 0) ? data[0] : null;
}

// 데이터 생성 (POST)
async function createData(table, data) {
    return await fetchAPI(table, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// 데이터 수정 (PATCH)
async function updateData(table, id, data) {
    return await fetchAPI(`${table}?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

// 데이터 삭제 (DELETE)
async function deleteData(table, id) {
    return await fetchAPI(`${table}?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// --- 공통 UI 기능 ---
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="loading"></div><p style="margin-top: 20px;">로딩 중...</p></div>';
    }
}

function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<div class="error-box">${message}</div>`;
    }
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'block';
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function formatPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    return phone;
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function goBack() {
    window.history.back();
}
