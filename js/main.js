// ===============================
// main.js
// Vercel + Supabase 공통 유틸
// ===============================

// Supabase 연결 정보
const SUPABASE_URL = "https://ewncpxwxgsxgmpmsdsfd.supabase.co";
const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY"; // ← 기존 키로 교체

// -------------------------------
// 공통 API 호출
// -------------------------------
async function fetchAPI(endpoint, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;

    const headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    };

    const response = await fetch(url, {
        ...options,
        headers: {
            ...headers,
            ...(options.headers || {})
        }
    });

    if (!response.ok) {
        let errorText = "";
        try {
            errorText = await response.text();
        } catch (_) {
            errorText = "알 수 없는 오류";
        }

        console.error("Supabase API 오류:", {
            endpoint,
            status: response.status,
            statusText: response.statusText,
            body: errorText
        });

        throw new Error(`DB 연결 실패: ${response.status}`);
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
        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {
            return;
        }

        // 특수 처리: 정렬
        if (key === "order") {
            query.set("order", value);
            return;
        }

        // limit, offset도 그대로 전달
        if (key === "limit" || key === "offset") {
            query.set(key, String(value));
            return;
        }

        // 배열이면 in.() 문법 사용
        if (Array.isArray(value)) {
            query.set(key, `in.(${value.join(",")})`);
            return;
        }

        // 객체 형태의 고급 필터
        if (typeof value === "object" && value.operator && value.value !== undefined) {
            query.set(key, `${value.operator}.${value.value}`);
            return;
        }

        // 기본 eq
        query.set(key, `eq.${value}`);
    });

    const qs = query.toString();
    return qs ? `?${qs}` : "";
}

// -------------------------------
// CRUD 함수
// -------------------------------
async function getData(table, params = {}) {
    const query = buildQueryString(params);
    const result = await fetchAPI(`${table}${query}`, {
        method: "GET"
    });

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
    return await fetchAPI(`${table}?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
            "Prefer": "return=representation"
        }
    });
}

// 호환용 별칭
async function createRecord(table, data) {
    return await createData(table, data);
}

// -------------------------------
// UI 공통 함수
// -------------------------------
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div class="loading"></div>
                <p style="margin-top: 20px;">로딩 중...</p>
            </div>
        `;
    }
}

function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="warning-box" style="text-align: center;">
                <p>${message}</p>
            </div>
        `;
    }
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add("active");
        modal.style.display = "flex";
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove("active");
        modal.style.display = "none";
    }
}

function showConfirm(message) {
    return window.confirm(message);
}

function goToHome() {
    window.location.href = "index.html";
}

function navigateToSelection() {
    window.location.href = "selection.html";
}

function navigateToSuccess() {
    window.location.href = "success.html";
}

// -------------------------------
// 포맷/유틸 함수
// -------------------------------
function generateUUID() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
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
    const [year, month, day] = dateString.split("-");
    return `${month}/${day}`;
}

function formatDateDisplay(dateString) {
    if (!dateString) return "";

    const date = new Date(`${dateString}T00:00:00`);
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];

    return `${year}년 ${month}월 ${day}일 (${weekday})`;
}

function isPastDate(dateString) {
    if (!dateString) return false;

    const target = new Date(`${dateString}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return target < today;
}

// 모달 외부 클릭 시 닫기
document.addEventListener("click", function (e) {
    const modal = e.target.closest(".modal");
    if (modal && e.target === modal) {
        hideModal(modal.id);
    }
});
