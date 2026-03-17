// Supabase 연결 정보
const SUPABASE_URL = "https://ewncpxwxgsxgmpmsdsfd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bmNweHd4Z3N4Z21wbXNkc2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjIwNDEsImV4cCI6MjA4OTI5ODA0MX0.EZWZNL86U-DQfWE3v-XMHqigZWHRLzDlE-lrqNGwJ2k";

// 공통 API 호출 함수 (Supabase REST API 방식)
async function fetchAPI(endpoint, options = {}) {
    // 젠스파크 방식(tables/...)에서 Supabase 방식(rest/v1/...)으로 주소 변경
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
    
    // 데이터가 없는 경우(204 No Content) 처리
    if (response.status === 204) return null;
    return await response.json();
}

// 데이터를 가져오는 함수 (필터링 포함)
async function getData(table, params = {}) {
    let query = "";
    // id 파라미터가 있으면 Supabase 필터링 문법(?id=eq.값) 사용
    if (params.id) {
        query = `?id=eq.${params.id}`;
    }
    return await fetchAPI(table + query);
}

// 단일 레코드 가져오기 (배열의 첫 번째 요소 반환)
async function getRecord(table, id) {
    const data = await getData(table, { id });
    return (data && data.length > 0) ? data[0] : null;
}

// 예약 정보 저장 (POST 요청)
async function createRecord(table, data) {
    return await fetchAPI(table, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// --- 아래는 웹 화면 UI 관련 기존 함수들 (그대로 유지) ---

function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="loading"></div><p style="margin-top: 20px;">로딩 중...</p></div>';
    }
}

function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `<div class="warning-box" style="text-align: center;"><p>${message}</p></div>`;
    }
}

function goToHome() { window.location.href = 'index.html'; }
function navigateToSelection() { window.location.href = 'selection.html'; }