// [보안 유지] Supabase 연결 설정
const SUPABASE_URL = "https://ewncpxwxgsxgmpmsdsfd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bmNweHd4Z3N4Z21wbXNkc2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjIwNDEsImV4cCI6MjA4OTI5ODA0MX0.EZWZNL86U-DQfWE3v-XMHqigZWHRLzDlE-lrqNGwJ2k";

/**
 * 1. 서버 통신 엔진 (Supabase 최적화)
 * 기존 fetchAPI와 호환성을 유지하면서 실제 DB와 연결합니다.
 */
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
        throw new Error(`DB 통신 실패: ${response.status}`);
    }
    return response.status === 204 ? null : await response.json();
}

// 데이터 조회 (기존 getData와 100% 호환)
async function getData(table, params = {}) {
    let query = "";
    if (params.id) {
        query = `?id=eq.${params.id}`;
    }
    // Supabase는 배열로 응답하므로 그대로 반환
    return await fetchAPI(table + query);
}

// 단일 레코드 조회
async function getRecord(table, id) {
    const data = await getData(table, { id });
    return (data && data.length > 0) ? data[0] : null;
}

// 데이터 생성
async function createData(table, data) {
    return await fetchAPI(table, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// 데이터 수정
async function updateData(table, id, data) {
    return await fetchAPI(`${table}?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

// 데이터 삭제
async function deleteData(table, id) {
    return await fetchAPI(`${table}?id=eq.${id}`, {
        method: 'DELETE'
    });
}

/**
 * 2. 원본 UI 세부 기능 복구 (하나도 빠짐없이 유지)
 */

// 로딩 표시 기능
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div class="loading"></div>
                <p style="margin-top: 20px; color: #666;">데이터를 불러오는 중...</p>
            </div>
        `;
    }
}

// 에러 표시 기능
function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="error-box" style="padding: 20px; text-align: center; color: #e53e3e;">
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top:10px; padding:5px 10px; cursor:pointer;">새로고침</button>
            </div>
        `;
    }
}

// 모달 제어 (중앙 정렬 스타일 포함)
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// 날짜 포맷 변환 (YYYY-MM-DD -> YYYY년 MM월 DD일)
function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// 전화번호 포맷팅 (01012345678 -> 010-1234-5678)
function formatPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    return phone;
}

// 고유 ID 생성 (UUID)
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// 페이지 이동 함수
function goBack() { window.history.back(); }
function navigateToSuccess() { window.location.href = 'success.html'; }

console.log("선문대 치위생 시스템: Supabase 엔진 정상 작동 중");
