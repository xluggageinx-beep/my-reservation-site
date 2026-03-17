// Supabase 연결 정보 (사용자 정보 유지)
const SUPABASE_URL = "https://ewncpxwxgsxgmpmsdsfd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bmNweHd4Z3N4Z21wbXNkc2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjIwNDEsImV4cCI6MjA4OTI5ODA0MX0.EZWZNL86U-DQfWE3v-XMHqigZWHRLzDlE-lrqNGwJ2k";

/**
 * [핵심 수정] Supabase 전용 공통 API 호출 함수
 * 기존 젠스파크의 fetchAPI 구조를 그대로 유지하여 호환성을 확보했습니다.
 */
async function fetchAPI(endpoint, options = {}) {
    // 젠스파크 방식(tables/...)에서 Supabase 방식(rest/v1/...)으로 주소 체계 변경
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation" // 생성/수정 시 데이터를 즉시 반환받기 위함
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

/**
 * 데이터를 가져오는 함수 (필터링 포함)
 * Supabase는 결과가 배열로 바로 오기 때문에 .data 처리를 제거했습니다.
 */
async function getData(table, params = {}) {
    let query = "";
    // id 파라미터가 있으면 Supabase 필터링 문법(?id=eq.값) 사용
    if (params.id) {
        query = `?id=eq.${params.id}`;
    }
    // 정렬이 필요한 경우 등 추가 쿼리 확장 가능
    return await fetchAPI(table + query);
}

// 단일 레코드 가져오기 (배열의 첫 번째 요소 반환)
async function getRecord(table, id) {
    const data = await getData(table, { id });
    return (data && data.length > 0) ? data[0] : null;
}

// 예약 정보 저장 (POST 요청)
async function createData(table, data) {
    return await fetchAPI(table, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// 데이터 수정 (PATCH 요청)
async function updateData(table, id, data) {
    return await fetchAPI(`${table}?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

// 데이터 삭제 (DELETE 요청)
async function deleteData(table, id) {
    return await fetchAPI(`${table}?id=eq.${id}`, {
        method: 'DELETE'
    });
}

// --- 아래는 기존 원본 코드의 UI/유틸리티 함수들을 하나도 빠짐없이 복구했습니다 ---

/**
 * 로딩 인디케이터 표시
 */
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div class="loading"></div>
                <p style="margin-top: 20px; color: #666;">데이터를 불러오는 중입니다...</p>
            </div>
        `;
    }
}

/**
 * 에러 메시지 표시
 */
function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="error-box" style="padding: 20px; background-color: #fff5f5; border: 1px solid #feb2b2; border-radius: 8px; color: #c53030; text-align: center;">
                <p>${message}</p>
                <button class="btn btn-secondary btn-sm" style="margin-top: 10px;" onclick="window.location.reload()">다시 시도</button>
            </div>
        `;
    }
}

/**
 * 모달 표시 (기존 스타일 유지)
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // 스크롤 방지
    }
}

/**
 * 모달 숨기기
 */
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

/**
 * 날짜 포맷팅 (YYYY-MM-DD -> YYYY년 MM월 DD일)
 */
function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    } catch (e) {
        return dateStr;
    }
}

/**
 * 전화번호 자동 포맷팅 (01012345678 -> 010-1234-5678)
 */
function formatPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    } else if (cleaned.length === 10) {
        return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    return phone;
}

/**
 * 고유 ID 생성 (UUID v4 유사 방식)
 * Supabase에 데이터를 넣을 때 ID가 필요하므로 유지합니다.
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * 페이지 이동 관련 공통 함수
 */
function goBack() {
    window.history.back();
}

function navigateToIndex() {
    window.location.href = 'index.html';
}

function navigateToSuccess() {
    window.location.href = 'success.html';
}

// 모든 페이지 로드 시 기본적인 콘솔 로그 (디버깅용)
console.log("선문대학교 치위생학과 시스템 엔진 가동 중...");
