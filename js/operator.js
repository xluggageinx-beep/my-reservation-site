// 술자모드 관리자 페이지 로직 전문
const OPERATOR_PASSWORD = '0814';
let isAuthenticated = false;
let times = [], operators = [], reservations = [];

// 인증 로직
async function authenticate() {
    const pw = document.getElementById('password').value;
    if (pw === OPERATOR_PASSWORD) {
        isAuthenticated = true;
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('manageSection').style.display = 'block';
        showTimesManagement();
    } else {
        alert('패스워드가 올바르지 않습니다.');
    }
}

// 탭 활성화 상태 표시 (요청 2번 해결)
function setActiveTab(tabId) {
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');
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

// 술자 관리 (일괄 삭제 및 카드 디자인 복구)
async function loadOperators() {
    showLoading('operatorsList');
    operators = await getData('operators') || [];
    times = await getData('times') || [];
    displayOperators();
}

function displayOperators() {
    const list = document.getElementById('operatorsList');
    list.innerHTML = `
        <div class="admin-actions" style="margin-bottom:15px; display:flex; gap:10px;">
            <button class="btn btn-primary btn-sm" onclick="openOperatorModal()">술자 추가</button>
            <button class="btn btn-danger btn-sm" onclick="deleteAllOperators()">술자 일괄 삭제</button>
        </div>
    `;
    operators.forEach(op => {
        const t = times.find(time => time.id === op.time_id);
        const card = document.createElement('div');
        card.className = 'admin-card';
        card.innerHTML = `
            <div class="admin-card-info">
                <strong>${op.name}</strong>
                <span>${op.student_id} / ${t ? t.name : '미지정'}</span>
            </div>
            <div class="admin-card-actions">
                <button class="btn btn-secondary btn-sm" onclick="editOperatorItem('${op.id}')">수정</button>
                <button class="btn btn-danger btn-sm" onclick="deleteOperatorItem('${op.id}')">삭제</button>
            </div>
        `;
        list.appendChild(card);
    });
}

// 예약 관리 (표 레이아웃 및 예약 개수 표시 - 요청 3번)
async function loadReservationsSummary() {
    showLoading('reservationsSummary');
    reservations = await getData('reservations') || [];
    operators = await getData('operators') || [];
    const container = document.getElementById('reservationsSummary');
    
    container.innerHTML = `
        <div style="margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:bold; color:var(--primary-color);">현재 예약: ${reservations.length}건</span>
            <button class="btn btn-secondary btn-sm" onclick="exportToCSV()">엑셀 다운로드</button>
        </div>
        <div class="table-container" style="overflow-x:auto;">
            <table class="admin-table" style="width:100%; min-width:500px;">
                <thead>
                    <tr>
                        <th>날짜</th><th>대상자</th><th>연락처</th><th>담당술자</th><th>관리</th>
                    </tr>
                </thead>
                <tbody>
                    ${reservations.map(r => {
                        const op = operators.find(o => o.id === r.operator_id);
                        return `
                        <tr>
                            <td>${r.reservation_date}</td>
                            <td>${r.participant_name}</td>
                            <td>${formatPhone(r.participant_phone)}</td>
                            <td>${op ? op.name : '-'}</td>
                            <td><button class="btn btn-danger btn-xs" style="width:auto; padding:2px 8px;" onclick="deleteReservation('${r.id}')">취소</button></td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function deleteAllOperators() {
    if(confirm('모든 술자를 삭제하시겠습니까?')) {
        for(const op of operators) await deleteData('operators', op.id);
        await loadOperators();
    }
}
