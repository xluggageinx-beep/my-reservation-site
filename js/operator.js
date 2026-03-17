// 술자모드 관리자 페이지 로직 전문
const OPERATOR_PASSWORD = '0814';
let isAuthenticated = false;
let times = [];
let operators = [];
let reservations = [];

// 수정용 전역 변수
let currentEditingTime = null;
let currentEditingOperator = null;

/**
 * 1. 보안 및 인증
 */
async function authenticate() {
    const passwordInput = document.getElementById('password');
    const password = passwordInput.value;
    
    if (password === OPERATOR_PASSWORD) {
        isAuthenticated = true;
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('manageSection').style.display = 'block';
        // 인증 성공 후 첫 탭 로드
        showTimesManagement();
    } else {
        alert('패스워드가 올바르지 않습니다.');
        passwordInput.value = '';
        passwordInput.focus();
    }
}

/**
 * 2. 탭 제어 및 메뉴 전환 (활성화 상태 UI 복구)
 */
function setActiveTab(tabId) {
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.id === tabId) tab.classList.add('active');
    });
}

async function showTimesManagement() {
    setActiveTab('tab-times');
    document.getElementById('timesManagement').style.display = 'block';
    document.getElementById('operatorsManagement').style.display = 'none';
    document.getElementById('reservationsManagement').style.display = 'none';
    await loadTimes();
}

async function showOperatorsManagement() {
    setActiveTab('tab-operators');
    document.getElementById('timesManagement').style.display = 'none';
    document.getElementById('operatorsManagement').style.display = 'block';
    document.getElementById('reservationsManagement').style.display = 'none';
    await loadOperators();
}

async function showReservationsManagement() {
    setActiveTab('tab-reservations');
    document.getElementById('timesManagement').style.display = 'none';
    document.getElementById('operatorsManagement').style.display = 'none';
    document.getElementById('reservationsManagement').style.display = 'block';
    await loadReservationsSummary();
}

/**
 * 3. 타임(Time) 관리 - CRUD 완벽 복구
 */
async function loadTimes() {
    showLoading('timesList');
    try {
        times = await getData('times') || [];
        displayTimes();
    } catch (e) { showError('timesList', '타임 데이터를 로드할 수 없습니다.'); }
}

function displayTimes() {
    const list = document.getElementById('timesList');
    if (!list) return;
    list.innerHTML = '';

    if (times.length === 0) {
        list.innerHTML = '<p class="empty-msg">등록된 타임이 없습니다. 새로운 타임을 추가해주세요.</p>';
        return;
    }

    const dayOrder = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5 };
    const sorted = [...times].sort((a, b) => (dayOrder[a.day_of_week] || 9) - (dayOrder[b.day_of_week] || 9));

    sorted.forEach(t => {
        const card = document.createElement('div');
        card.className = 'admin-card';
        card.innerHTML = `
            <div class="admin-card-info">
                <strong>${t.name}</strong>
                <span>${t.day_of_week}요일 / ${t.time_range}</span>
            </div>
            <div class="admin-card-actions">
                <button class="btn btn-secondary btn-sm" onclick="editTimeItem('${t.id}')">수정</button>
                <button class="btn btn-danger btn-sm" onclick="deleteTimeItem('${t.id}')">삭제</button>
            </div>
        `;
        list.appendChild(card);
    });
}

async function saveTime() {
    const name = document.getElementById('timeName').value.trim();
    const day = document.getElementById('dayOfWeek').value;
    const range = document.getElementById('timeRange').value.trim();

    if (!name || !range) { alert('모든 필드를 입력해주세요.'); return; }

    const data = { name, day_of_week: day, time_range: range };
    try {
        if (currentEditingTime) {
            await updateData('times', currentEditingTime.id, data);
        } else {
            await createData('times', { ...data, id: generateUUID() });
        }
        hideModal('timeModal');
        await loadTimes();
    } catch (e) { alert('데이터 저장 중 오류가 발생했습니다.'); }
}

/**
 * 4. 술자(Operator) 관리 - 사진 3번 디자인 및 일괄 삭제 복구
 */
async function loadOperators() {
    showLoading('operatorsList');
    try {
        operators = await getData('operators') || [];
        times = await getData('times') || [];
        displayOperators();
    } catch (e) { showError('operatorsList', '술자 데이터를 로드할 수 없습니다.'); }
}

function displayOperators() {
    const list = document.getElementById('operatorsList');
    list.innerHTML = `
        <div class="admin-actions" style="margin-bottom:20px; display:flex; gap:10px;">
            <button class="btn btn-primary btn-sm" onclick="openOperatorModal()">+ 술자 추가</button>
            <button class="btn btn-danger btn-sm" onclick="deleteAllOperators()">전체 술자 삭제</button>
        </div>
    `;

    if (operators.length === 0) {
        list.innerHTML += '<p class="empty-msg">등록된 술자가 없습니다.</p>';
        return;
    }

    // 등록 순서(ID순)로 나열
    const sortedOps = [...operators].sort((a, b) => a.id.localeCompare(b.id));

    sortedOps.forEach(op => {
        const t = times.find(time => time.id === op.time_id);
        const card = document.createElement('div');
        card.className = 'admin-card';
        card.innerHTML = `
            <div class="admin-card-info">
                <strong style="font-size:1.1em; color:var(--primary-color);">${op.name}</strong>
                <span>학번: ${op.student_id} | 소속: ${t ? t.name : '미지정'}</span>
            </div>
            <div class="admin-card-actions">
                <button class="btn btn-secondary btn-sm" onclick="editOperatorItem('${op.id}')">수정</button>
                <button class="btn btn-danger btn-sm" onclick="deleteOperatorItem('${op.id}')">삭제</button>
            </div>
        `;
        list.appendChild(card);
    });
}

async function deleteAllOperators() {
    if (!confirm('경고: 모든 술자 정보를 삭제하시겠습니까?\n연결된 예약 관리에도 영향을 줄 수 있습니다.')) return;
    try {
        for (const op of operators) {
            await deleteData('operators', op.id);
        }
        alert('모든 술자 정보가 삭제되었습니다.');
        await loadOperators();
    } catch (e) { alert('삭제 실패'); }
}

/**
 * 5. 예약 관리 - 사진 5, 6번 항목 및 표 너비 복구
 */
async function loadReservationsSummary() {
    showLoading('reservationsSummary');
    try {
        reservations = await getData('reservations') || [];
        operators = await getData('operators') || [];
        displayReservationsSummary();
    } catch (e) { showError('reservationsSummary', '예약 내역 로드 실패'); }
}

function displayReservationsSummary() {
    const container = document.getElementById('reservationsSummary');
    const totalCount = reservations.length;

    container.innerHTML = `
        <div class="summary-header-box" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; background:#fff; padding:15px; border-radius:10px; border:1px solid #eee;">
            <div><strong>현재 총 예약:</strong> <span style="color:var(--primary-color); font-size:1.2em;">${totalCount}</span> 건</div>
            <div style="display:flex; gap:10px;">
                <button class="btn btn-secondary btn-sm" style="width:auto;" onclick="exportToCSV()">엑셀(CSV) 다운로드</button>
                <button class="btn btn-danger btn-sm" style="width:auto;" onclick="deleteAllReservations()">전체 예약 삭제</button>
            </div>
        </div>
        <div class="admin-table-wrapper" style="overflow-x:auto; background:white; border-radius:10px; border:1px solid #eee;">
            <table class="admin-table" style="width:100%; min-width:650px;">
                <thead>
                    <tr>
                        <th style="width:110px;">예약일</th>
                        <th style="width:90px;">대상자</th>
                        <th style="width:130px;">연락처</th>
                        <th>담당술자</th>
                        <th style="width:80px;">관리</th>
                    </tr>
                </thead>
                <tbody>
                    ${reservations.sort((a,b) => b.reservation_date.localeCompare(a.reservation_date)).map(r => {
                        const op = operators.find(o => o.id === r.operator_id);
                        return `
                        <tr>
                            <td>${r.reservation_date}</td>
                            <td style="font-weight:bold;">${r.participant_name}</td>
                            <td>${formatPhone(r.participant_phone)}</td>
                            <td style="color:#666;">${op ? op.name : '<span style="color:red;">정보없음</span>'}</td>
                            <td><button class="btn btn-danger btn-xs" onclick="deleteReservation('${r.id}')">취소</button></td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// 엑셀 다운로드 (BOM 추가로 한글 깨짐 방지 - 원본 로직)
function exportToCSV() {
    if (reservations.length === 0) return alert('다운로드할 데이터가 없습니다.');
    let csv = "\uFEFF예약일,대상자명,생년월일,연락처,주소,직업,관계,담당술자\n";
    reservations.forEach(r => {
        const op = operators.find(o => o.id === r.operator_id);
        csv += `${r.reservation_date},${r.participant_name},${r.participant_birthdate},${r.participant_phone},"${r.participant_address}",${r.participant_occupation},${r.participant_relationship},${op ? op.name : ''}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `선문대_예약명단_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
}

/**
 * 초기화 및 이벤트 바인딩
 */
document.addEventListener('DOMContentLoaded', () => {
    const pwInput = document.getElementById('password');
    if (pwInput) {
        pwInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') authenticate(); });
    }
});
