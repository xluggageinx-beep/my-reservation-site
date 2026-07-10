// ===============================
// main.js
// Supabase 공통 유틸
// ===============================

const SUPABASE_URL = "https://ewncpxwxgsxgmpmsdsfd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bmNweHd4Z3N4Z21wbXNkc2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjIwNDEsImV4cCI6MjA4OTI5ODA0MX0.EZWZNL86U-DQfWE3v-XMHqigZWHRLzDlE-lrqNGwJ2k";

// -------------------------------
// API 호출
// -------------------------------
async function fetchAPI(endpoint, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;

    const headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
        ...((options && options.headers) || {})
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (!response.ok) {
        let errorText = "";
        try {
            errorText = await response.text();
        } catch (_) {}

        console.error("Supabase API 오류:", {
            endpoint,
            status: response.status,
            statusText: response.statusText,
            body: errorText
        });

        throw new Error(`DB 연결 실패: ${response.status} ${response.statusText}`);
    }

    if (response.status === 204) return null;

    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

// -------------------------------
// 쿼리 문자열 생성
// -------------------------------
function buildQueryString(params = {}) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;

        if (key === "order") {
            query.set("order", value);
            return;
        }

        if (key === "limit" || key === "offset") {
            query.set(key, String(value));
            return;
        }

        if (Array.isArray(value)) {
            query.set(key, `in.(${value.join(",")})`);
            return;
        }

        if (typeof value === "object" && value.operator && value.value !== undefined) {
            query.set(key, `${value.operator}.${value.value}`);
            return;
        }

        query.set(key, `eq.${value}`);
    });

    const qs = query.toString();
    return qs ? `?${qs}` : "";
}

// -------------------------------
// CRUD
// -------------------------------
async function getData(table, params = {}) {
    const query = buildQueryString(params);
    const result = await fetchAPI(`${table}${query}`, { method: "GET" });
    return Array.isArray(result) ? result : [];
}

async function getRecord(table, id) {
    const rows = await getData(table, { id, limit: 1 });
    return rows.length > 0 ? rows[0] : null;
}

async function createData(table, data) {
    const result = await fetchAPI(table, {
        method: "POST",
        body: JSON.stringify(data)
    });
    return Array.isArray(result) ? result[0] : result;
}

async function updateData(table, id, data) {
    const result = await fetchAPI(`${table}?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(data)
    });
    return Array.isArray(result) ? result[0] : result;
}

async function deleteData(table, id) {
    const result = await fetchAPI(`${table}?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
            "Prefer": "return=representation"
        }
    });
    return Array.isArray(result) ? result[0] : result;
}

// 기존 코드 호환용
async function createRecord(table, data) {
    return await createData(table, data);
}

// -------------------------------
// 페이지 이동
// -------------------------------
function goToHome() {
    window.location.href = "index.html";
}

function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        goToHome();
    }
}

function navigateToConsent() {
    window.location.href = "consent.html";
}

function navigateToOperatorMode() {
    window.location.href = "operator.html";
}

function navigateToSelection() {
    window.location.href = "selection.html";
}

function navigateToReservationCheck() {
    window.location.href = "reservation-check.html";
}

function navigateToSuccess() {
    window.location.href = "success.html";
}

// -------------------------------
// UI
// -------------------------------
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div style="text-align:center; padding:40px;">
            <div class="loading"></div>
            <p style="margin-top:20px;">로딩 중...</p>
        </div>
    `;
}

function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="warning-box" style="text-align:center;">
            <p>${message}</p>
        </div>
    `;
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add("active");
    modal.style.display = "flex";
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove("active");
    modal.style.display = "none";
}

function showConfirm(message) {
    return window.confirm(message);
}

// -------------------------------
// 유틸
// -------------------------------
function generateUUID() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function formatPhone(phone) {
    const digits = String(phone || "").replace(/\D/g, "");

    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    if (digits.length <= 11) return `${digits.slice(0, 3)}-${digits.slice(3, digits.length - 4)}-${digits.slice(-4)}`;

    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

function formatDate(date) {
    const d = (date instanceof Date) ? date : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDateShort(dateString) {
    if (!dateString) return "";
    const parts = dateString.split("-");
    return `${parts[1]}/${parts[2]}`;
}

function formatDateDisplay(dateString) {
    if (!dateString) return "";

    const date = new Date(`${dateString}T00:00:00`);
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${weekdays[date.getDay()]})`;
}

function isPastDate(dateString) {
    if (!dateString) return false;

    const target = new Date(`${dateString}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return target < today;
}

// 모달 바깥 클릭 닫기
document.addEventListener("click", function(e) {
    if (e.target.classList && e.target.classList.contains("modal")) {
        hideModal(e.target.id);
    }
});

// -------------------------------
// 학기(Semester) 유틸
// -------------------------------

/**
 * 활성 학기 1개를 반환합니다.
 * is_active = true 인 행이 없으면 null 반환.
 */
async function getActiveSemester() {
    const rows = await getData('semesters', {
        is_active: true,
        limit: 1
    });
    return rows.length > 0 ? rows[0] : null;
}

/**
 * 모든 학기 목록을 최신순으로 반환합니다.
 */
async function getAllSemesters() {
    return await getData('semesters', {
        order: 'created_at.desc',
        limit: 100
    });
}

/**
 * 학기를 생성합니다.
 * @param {string} name  예: "2025-1학기"
 */
async function createSemester(name) {
    const data = {
        id: generateUUID(),
        name: name,
        is_active: false
    };
    return await createData('semesters', data);
}

/**
 * 특정 학기를 활성화합니다.
 * 기존 활성 학기들을 모두 비활성화한 뒤 대상 학기를 활성화합니다.
 * @param {string} semesterId
 */
async function activateSemester(semesterId) {
    // 기존 활성 학기 전체 비활성화
    const activeSemesters = await getData('semesters', { is_active: true, limit: 100 });
    for (const sem of activeSemesters) {
        if (sem.id !== semesterId) {
            await updateData('semesters', sem.id, { is_active: false });
        }
    }
    // 대상 학기 활성화
    return await updateData('semesters', semesterId, { is_active: true });
}

/**
 * 특정 학기를 비활성화합니다.
 * @param {string} semesterId
 */
async function deactivateSemester(semesterId) {
    return await updateData('semesters', semesterId, { is_active: false });
}

/**
 * 특정 학기를 삭제합니다.
 * 해당 학기에 속한 times/operators가 있으면 삭제 거부.
 * @param {string} semesterId
 */
async function deleteSemester(semesterId) {
    const linkedTimes = await getData('times', { semester_id: semesterId, limit: 1 });
    if (linkedTimes.length > 0) {
        throw new Error('이 학기에 속한 타임이 있습니다. 먼저 타임을 삭제해주세요.');
    }
    return await deleteData('semesters', semesterId);
}
