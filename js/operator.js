// 술자모드 페이지 로직 전문

const OPERATOR_PASSWORD = '0814';
let isAuthenticated = false;
let times = [];
let operators = [];
let reservations = [];

// 수정/삭제를 위한 상태 변수
let currentEditingTime = null;
let currentEditingOperator = null;

/**
 * 1. 인증 로직
 */
async function authenticate() {
    const password = document.getElementById('password').value;
    
    if (password === OPERATOR_PASSWORD) {
        isAuthenticated = true;
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('manageSection').style.display = 'block';
        await showTimesManagement(); // 기본 화면: 타임 관리
    } else {
        alert('패스워드가 올바르지 않습니다.');
        document.getElementById('password').value = '';
    }
}

/**
 * 2. 메뉴 전환 로직 (기존 탭 UI 유지)
 */
async function showTimesManagement() {
    setActiveTab('tab-times');
    document.getElementById('timesManagement').style.display = 'block';
    document.getElementById('operatorsManagement').style.display = 'none';
    const resMgmt = document.getElementById('reservationsManagement');
    if (resMgmt) resMgmt.style.display = 'none';
    await loadTimes();
}

async function showOperatorsManagement() {
    setActiveTab('tab-operators');
    document.getElementById('timesManagement').style.display = 'none';
    document.getElementById('operatorsManagement').style.display = 'block';
    const resMgmt = document.getElementById('reservationsManagement');
    if (resMgmt) resMgmt.style.display = 'none';
    await loadOperators();
}

async function showReservationsManagement() {
    setActiveTab('tab-reservations');
    document.getElementById('timesManagement').style.display = 'none';
    document.getElementById('operatorsManagement').style.display = 'none';
    const resMgmt = document.getElementById('reservationsManagement');
    if (resMgmt) {
        resMgmt.style.display = 'block';
        await loadReservationsSummary();
    }
}

function setActiveTab(tabId) {
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
        if (tab.id === tabId) tab.classList.add('active');
        else tab.classList.remove('active');
    });
}

/**
 * 3. 타임 관리 로직 (CRUD)
 */
async function loadTimes() {
    showLoading('timesList');
    try {
        const response = await getData('times');
        times = response || [];
        displayTimes();
    } catch (e) { showError('timesList', '타임 로드 실패'); }
}

function displayTimes() {
    const list = document.getElementById('timesList');
    if (!list) return;
    if (times.length === 0) { list.innerHTML = '<p class="empty-msg">등록된 타임이 없습니다.</p>'; return; }

    const dayOrder = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5 };
    const sorted = [...times].sort((a, b) => (dayOrder[a.day_of_week] || 0) - (dayOrder[b.day_of_week] || 0));

    list.innerHTML = sorted.map(t => `
        <div class="admin-card">
            <div class="admin-card-info">
                <strong>${t.name}</strong>
                <span>${t.day_of_week}요일 / ${t.time_range}</span>
            </div>
            <div class="admin-card-actions">
                <button class="btn btn-secondary btn-sm" onclick="editTimeItem('${t.id}')">수정</button>
                <button class="btn btn-danger btn-sm" onclick="deleteTimeItem('${t.id}')">삭제</button>
            </div>
        </div>
    `).join('');
}

async function saveTime() {
    const name = document.getElementById('timeName').value.trim();
    const day = document.getElementById('dayOfWeek').value;
    const range = document.getElementById('timeRange').value.trim();
    if (!name || !range) return alert('내용을 입력해주세요.');

    try {
        const data = { name, day_of_week: day, time_range: range };
        if (currentEditingTime) {
            await updateData('times', currentEditingTime.id, data);
        } else {
            await createData('times', { ...data, id: generateUUID() });
        }
        hideModal('timeModal');
        await loadTimes();
    } catch (e) { alert('저장 실패'); }
}

async function deleteTimeItem(id) {
    if (confirm('이 타임을 삭제하시겠습니까? 연결된 술자 정보도 함께 확인하십시오.')) {
        await deleteData('times', id);
        await loadTimes();
    }
}

function openTimeModal() {
    currentEditingTime = null;
    document.getElementById('timeModalTitle').innerText = '타임 추가';
    document.getElementById('timeName').value = '';
    document.getElementById('timeRange').value = '';
    showModal('timeModal');
}

function editTimeItem(id) {
    currentEditingTime = times.find(t => t.id === id);
    document.getElementById('timeModalTitle').innerText = '타임 수정';
    document.getElementById('timeName').value = currentEditingTime.name;
    document.getElementById('dayOfWeek').value = currentEditingTime.day_of_week;
    document.getElementById('timeRange').value = currentEditingTime.time_range;
    showModal('timeModal');
}

/**
 * 4. 술자 관리 로직 (CRUD)
 */
async function loadOperators() {
    showLoading('operatorsList');
    try {
        operators = await getData('operators') || [];
        times = await getData('times') || [];
        displayOperators();
    } catch (e) { showError('operatorsList', '술자 로드 실패'); }
}

function displayOperators() {
    const list = document.getElementById('operatorsList');
    if (!list) return;
    if (operators.length === 0) { list.innerHTML = '<p class="empty-msg">등록된 술자가 없습니다.</p>'; return; }

    list.innerHTML = operators.map(op => {
        const t = times.find(time => time.id === op.time_id);
        return `
            <div class="admin-card">
                <div class="admin-card-info">
                    <strong>${op.name}</strong>
                    <span>${op.student_id} / ${t ? t.name : '타임없음'}</span>
                </div>
                <div class="admin-card-actions">
                    <button class="btn btn-secondary btn-sm" onclick="editOperatorItem('${op.id}')">수정</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteOperatorItem('${op.id}')">삭제</button>
                </div>
            </div>
        `;
    }).join('');
}

async function saveOperator() {
    const name = document.getElementById('opName').value.trim();
    const sid = document.getElementById('opStudentId').value.trim();
    const tid = document.getElementById('opTimeSelect').value;
    if (!name || !sid || !tid) return alert('내용을 입력하세요.');

    try {
        const data = { name, student_id: sid, time_id: tid };
        if (currentEditingOperator) {
            await updateData('operators', currentEditingOperator.id, data);
        } else {
            await createData('operators', { ...data, id: generateUUID() });
        }
        hideModal('operatorModal');
        await loadOperators();
    } catch (e) { alert('저장 실패'); }
}

async function deleteOperatorItem(id) {
    if (confirm('이 술자를 삭제하시겠습니까?')) {
        await deleteData('operators', id);
        await loadOperators();
    }
}

function openOperatorModal() {
    currentEditingOperator = null;
    document.getElementById('operatorModalTitle').innerText = '술자 추가';
    document.getElementById('opName').value = '';
    document.getElementById('opStudentId').value = '';
    const sel = document.getElementById('opTimeSelect');
    sel.innerHTML = times.map(t => `<option value="${t.id}">${t.name} (${t.day_of_week})</option>`).join('');
    showModal('operatorModal');
}

function editOperatorItem(id) {
    currentEditingOperator = operators.find(o => o.id === id);
    document.getElementById('operatorModalTitle').innerText = '술자 수정';
    document.getElementById('opName').value = currentEditingOperator.name;
    document.getElementById('opStudentId').value = currentEditingOperator.student_id;
    const sel = document.getElementById('opTimeSelect');
    sel.innerHTML = times.map(t => `<option value="${t.id}" ${t.id === currentEditingOperator.time_id ? 'selected' : ''}>${t.name}</option>`).join('');
    showModal('operatorModal');
}

/**
 * 5. 예약 현황 및 부가 기능 (엑셀, 전체삭제)
 */
async function loadReservationsSummary() {
    showLoading('reservationsSummary');
    try {
        reservations = await getData('reservations') || [];
        operators = await getData('operators') || [];
        displayReservationsSummary();
    } catch (e) { showError('reservationsSummary', '예약 로드 실패'); }
}

function displayReservationsSummary() {
    const container = document.getElementById('reservationsSummary');
    if (!container) return;
    if (reservations.length === 0) { container.innerHTML = '<p class="empty-msg">예약 내역이 없습니다.</p>'; return; }

    const sorted = [...reservations].sort((a, b) => b.reservation_date.localeCompare(a.reservation_date));

    container.innerHTML = `
        <div class="stats-box" style="margin-bottom:20px; display:flex; gap:10px;">
            <button class="btn btn-secondary btn-sm" onclick="exportToCSV()">엑셀 다운로드</button>
            <button class="btn btn-danger btn-sm" onclick="deleteAllReservations()">전체 예약 삭제</button>
        </div>
        <table class="admin-table">
            <thead>
                <tr>
                    <th>날짜</th><th>대상자</th><th>연락처</th><th>담당술자</th><th>관리</th>
                </tr>
            </thead>
            <tbody>
                ${sorted.map(r => {
                    const op = operators.find(o => o.id === r.operator_id);
                    return `
                        <tr>
                            <td>${r.reservation_date}</td>
                            <td>${r.participant_name}</td>
                            <td>${formatPhone(r.participant_phone)}</td>
                            <td>${op ? op.name : '삭제됨'}</td>
                            <td><button class="btn btn-danger btn-sm" onclick="deleteReservation('${r.id}')">취소</button></td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

async function deleteReservation(id) {
    if (confirm('이 예약을 취소하시겠습니까?')) {
        await deleteData('reservations', id);
        await loadReservationsSummary();
    }
}

// 엑셀(CSV) 출력 - BOM 추가로 한글 깨짐 방지 (원본 기능)
function exportToCSV() {
    if (reservations.length === 0) return;
    let csv = "\uFEFF날짜,대상자명,생년월일,연락처,주소,직업,관계,술자명\n";
    reservations.forEach(r => {
        const op = operators.find(o => o.id === r.operator_id);
        csv += `${r.reservation_date},${r.participant_name},${r.participant_birthdate},${r.participant_phone},"${r.participant_address}",${r.participant_occupation},${r.participant_relationship},${op ? op.name : ''}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `선문대_예약명단_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 전체 삭제 - 2단계 확인 로직 (원본 기능)
async function deleteAllReservations() {
    if (!confirm('⚠️ 정말로 모든 예약을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다!')) return;
    if (!confirm('⚠️⚠️ 최종 확인: 시스템 내 모든 예약 데이터가 삭제됩니다.')) return;

    try {
        for (const res of reservations) {
            await deleteData('reservations', res.id);
        }
        alert('모든 예약이 삭제되었습니다.');
        await loadReservationsSummary();
    } catch (e) { alert('삭제 중 오류 발생'); }
}

document.addEventListener('DOMContentLoaded', () => {
    const pwInput = document.getElementById('password');
    if (pwInput) pwInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') authenticate(); });
});
