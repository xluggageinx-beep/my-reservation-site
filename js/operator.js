// 술자모드 페이지 로직

const OPERATOR_PASSWORD = '0814';
const SEMESTER_MANAGE_PASSWORD = '0123';

let isAuthenticated = false;
let isSemesterAuthenticated = false; // 학기 관리 별도 인증 여부

let times = [];
let operators = [];
let reservations = [];
let semesters = [];
let currentEditingTime = null;
let currentEditingOperator = null;
let selectedDatesForTime = [];
let currentEditingTimeForDates = null;
let selectedSemesterId = null; // 현재 타임 관리 중인 학기 ID

// ─────────────────────────────────────────────
// 탭 활성 상태 표시
// ─────────────────────────────────────────────
function setActiveTab(tabName) {
    const buttons = Array.from(document.querySelectorAll('#manageSection .button-group button'));
    buttons.forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
    });
    const target = buttons.find(btn => btn.textContent.trim() === tabName);
    if (target) {
        target.classList.remove('btn-secondary');
        target.classList.add('btn-primary');
    }
}

// ─────────────────────────────────────────────
// 관리자 패스워드 인증 (0814)
// ─────────────────────────────────────────────
async function authenticate() {
    const password = document.getElementById('password').value;
    if (password === OPERATOR_PASSWORD) {
        isAuthenticated = true;
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('manageSection').style.display = 'block';
        await showSemestersManagement();
    } else {
        alert('패스워드가 올바르지 않습니다.');
        document.getElementById('password').value = '';
    }
}

// ─────────────────────────────────────────────
// 탭 전환 공통 헬퍼
// ─────────────────────────────────────────────
function hideAllManagementSections() {
    ['semestersManagement', 'operatorsManagement', 'reservationsManagement']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
}

// ─────────────────────────────────────────────
// 학기 관리 탭 — 비밀번호 잠금 (0123)
// ─────────────────────────────────────────────
async function showSemestersManagement() {
    setActiveTab('학기 관리');
    hideAllManagementSections();
    document.getElementById('semestersManagement').style.display = 'block';

    // 인증 상태 초기화해서 항상 비밀번호부터 보여줌 (탭 전환 시)
    // 이미 인증된 상태면 바로 본문 표시
    if (isSemesterAuthenticated) {
        showSemesterManageBody();
        await loadSemesters();
    } else {
        await showSemesterAuthSection();
    }
}

async function showSemesterAuthSection() {
    document.getElementById('semesterAuthSection').style.display = 'block';
    document.getElementById('semesterManageBody').style.display = 'none';
    document.getElementById('semesterPassword').value = '';
    document.getElementById('semesterAuthError').style.display = 'none';
    await renderSemesterPreview();
}

// 비밀번호 입력 전 학기 현황 미리보기 렌더링
async function renderSemesterPreview() {
    const container = document.getElementById('semesterPreviewList');
    if (!container) return;

    container.innerHTML = '<p style="color:var(--text-light); font-size:0.85em;">학기 현황 로딩 중...</p>';

    try {
        const allSemesters = await getAllSemesters();
        if (allSemesters.length === 0) {
            container.innerHTML = '<p style="color:var(--text-light); font-size:0.85em; padding:8px 0;">등록된 학기가 없습니다.</p>';
            return;
        }

        // 각 학기의 타임 목록 로드
        const timesPerSem = {};
        for (const sem of allSemesters) {
            try {
                const t = await getData('times', { semester_id: sem.id, limit: 100 });
                timesPerSem[sem.id] = Array.isArray(t) ? t : [];
            } catch(e) { timesPerSem[sem.id] = []; }
        }

        container.innerHTML = allSemesters.map(sem => {
            const semTimes = timesPerSem[sem.id] || [];
            const badge = sem.is_active
                ? `<span style="background:var(--primary-color);color:#fff;padding:2px 9px;border-radius:20px;font-size:0.78em;font-weight:600;margin-left:8px;">활성</span>`
                : `<span style="background:#eee;color:#999;padding:2px 9px;border-radius:20px;font-size:0.78em;margin-left:8px;">비활성</span>`;
            const timeNames = semTimes.length > 0
                ? semTimes.map(t => `<span style="background:#f0f5ff;color:var(--primary-color);border:1px solid #c7d9ff;padding:2px 8px;border-radius:12px;font-size:0.8em;margin-right:4px;">${t.name}</span>`).join('')
                : `<span style="color:#bbb;font-size:0.8em;">타임 없음</span>`;
            return `
                <div style="display:flex;align-items:center;flex-wrap:wrap;gap:6px;padding:8px 12px;border-radius:8px;background:${sem.is_active ? '#f0f5ff' : '#f8f8f8'};border:1px solid ${sem.is_active ? '#c7d9ff' : '#e8e8e8'};margin-bottom:7px;">
                    <span style="font-weight:600;font-size:0.92em;color:#333;">${sem.name}</span>
                    ${badge}
                    <span style="color:#ccc;margin:0 2px;">|</span>
                    <span style="display:flex;flex-wrap:wrap;gap:4px;align-items:center;">${timeNames}</span>
                </div>`;
        }).join('');
    } catch(e) {
        container.innerHTML = '<p style="color:var(--text-light); font-size:0.85em;">학기 현황을 불러올 수 없습니다.</p>';
    }
}

function showSemesterManageBody() {
    document.getElementById('semesterAuthSection').style.display = 'none';
    document.getElementById('semesterManageBody').style.display = 'block';
}

async function authenticateSemester() {
    const pw = document.getElementById('semesterPassword').value;
    const errorEl = document.getElementById('semesterAuthError');

    if (pw === SEMESTER_MANAGE_PASSWORD) {
        isSemesterAuthenticated = true;
        errorEl.style.display = 'none';
        showSemesterManageBody();
        await loadSemesters();
    } else {
        errorEl.textContent = '비밀번호가 올바르지 않습니다.';
        errorEl.style.display = 'block';
        document.getElementById('semesterPassword').value = '';
    }
}

function lockSemesterManage() {
    isSemesterAuthenticated = false;
    showSemesterAuthSection(); // async지만 await 불필요 (fire-and-forget)
}

// ─────────────────────────────────────────────
// 학기 데이터 로드 & 표시
// ─────────────────────────────────────────────
async function loadSemesters() {
    const container = document.getElementById('semestersList');
    if (!container) return;

    showLoading('semestersList');

    try {
        semesters = await getAllSemesters();
        await displaySemesters();
    } catch (error) {
        console.error('학기 로드 오류:', error);
        container.innerHTML = `
            <div class="warning-box" style="text-align:center; padding:30px;">
                <p><strong>학기 데이터를 불러오는 중 오류가 발생했습니다.</strong></p>
                <button class="btn btn-primary" onclick="loadSemesters()" style="margin-top:15px;">다시 시도</button>
            </div>`;
    }
}

async function displaySemesters() {
    const container = document.getElementById('semestersList');
    if (!container) return;

    if (semesters.length === 0) {
        container.innerHTML = `
            <p style="text-align:center; padding:40px; color:var(--text-light);">
                등록된 학기가 없습니다. 학기를 추가해주세요.
            </p>`;
        updateActiveSemesterBadge();
        return;
    }

    // 각 학기별로 타임 목록도 함께 로드
    const timesPerSemester = {};
    for (const sem of semesters) {
        try {
            const semTimes = await getData('times', { semester_id: sem.id, limit: 1000 });
            timesPerSemester[sem.id] = Array.isArray(semTimes) ? semTimes : [];
        } catch(e) {
            timesPerSemester[sem.id] = [];
        }
    }

    container.innerHTML = '';

    semesters.forEach(sem => {
        const isActive = sem.is_active;
        const semTimes = timesPerSemester[sem.id] || [];

        const card = document.createElement('div');
        card.className = 'time-card';
        card.style.marginBottom = '24px';

        const statusBadge = isActive
            ? `<span style="color:#fff; background:var(--primary-color); padding:3px 12px; border-radius:20px; font-size:0.83em; font-weight:600;">✅ 활성</span>`
            : `<span style="color:#999; background:#eee; padding:3px 12px; border-radius:20px; font-size:0.83em;">비활성</span>`;

        const activateBtn = isActive
            ? `<button onclick="handleDeactivateSemester('${sem.id}')" class="btn btn-secondary" style="font-size:0.85em; padding:6px 14px;">비활성화</button>`
            : `<button onclick="handleActivateSemester('${sem.id}')" class="btn btn-primary" style="font-size:0.85em; padding:6px 14px;">활성화</button>`;

        // 타임 목록 렌더링
        let timesHtml = '';
        if (semTimes.length === 0) {
            timesHtml = `<p style="color:var(--text-light); font-size:0.88em; margin:8px 0 0;">등록된 타임 없음</p>`;
        } else {
            timesHtml = `
                <div style="margin-top:12px; display:flex; flex-wrap:wrap; gap:8px;">
                    ${semTimes.map(t => `
                        <div style="background:#f0f5ff; border:1px solid #c7d9ff; border-radius:8px; padding:6px 12px; font-size:0.85em;">
                            <strong>${t.name}</strong>
                            <span style="color:#666; margin-left:6px;">${t.day_of_week}요일 ${t.time_range}</span>
                            <button onclick="editTime('${t.id}','${sem.id}')"
                                style="margin-left:8px; background:none; border:none; color:var(--primary-color); cursor:pointer; font-size:0.88em; padding:0;">수정</button>
                            <button onclick="deleteTime('${t.id}')"
                                style="margin-left:4px; background:none; border:none; color:var(--danger); cursor:pointer; font-size:0.88em; padding:0;">삭제</button>
                        </div>
                    `).join('')}
                </div>`;
        }

        card.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <h3 style="margin:0; font-size:1.05em;">${sem.name}</h3>
                    ${statusBadge}
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    ${activateBtn}
                    <button onclick="showAddTimeModalForSemester('${sem.id}')"
                        class="btn btn-secondary" style="font-size:0.85em; padding:6px 14px;">
                        + 타임 추가
                    </button>
                    <button onclick="handleDeleteSemester('${sem.id}')"
                        class="btn btn-danger" style="font-size:0.85em; padding:6px 14px;">
                        학기 삭제
                    </button>
                </div>
            </div>
            <div id="timesOf_${sem.id}">
                ${timesHtml}
            </div>`;

        container.appendChild(card);
    });

    updateActiveSemesterBadge();
}

function updateActiveSemesterBadge() {
    const badge = document.getElementById('activeSemesterBadge');
    if (!badge) return;
    const activeSem = semesters.find(s => s.is_active);
    if (activeSem) {
        badge.textContent = `활성 학기: ${activeSem.name}`;
        badge.style.color = 'var(--primary-color)';
    } else {
        badge.textContent = '활성 학기 없음';
        badge.style.color = 'var(--danger)';
    }
}

async function handleActivateSemester(semesterId) {
    const sem = semesters.find(s => s.id === semesterId);
    if (!sem) return;

    const activeOthers = semesters.filter(s => s.is_active && s.id !== semesterId);
    const msg = activeOthers.length > 0
        ? `"${sem.name}"을 활성 학기로 추가하시겠습니까?\n현재 활성 학기: ${activeOthers.map(s => s.name).join(', ')}\n(복수 활성화가 허용됩니다)`
        : `"${sem.name}"을 활성 학기로 설정하시겠습니까?`;

    if (!confirm(msg)) return;
    try {
        // 기존 활성 학기를 건드리지 않고 이 학기만 활성화
        await updateData('semesters', semesterId, { is_active: true });
        selectedSemesterId = semesterId;
        alert(`"${sem.name}"이 활성 학기로 추가되었습니다.`);
        await loadSemesters();
    } catch (error) {
        console.error('학기 활성화 오류:', error);
        alert('학기 활성화 중 오류가 발생했습니다.');
    }
}

async function handleDeactivateSemester(semesterId) {
    const sem = semesters.find(s => s.id === semesterId);
    if (!sem) return;
    if (!confirm(`"${sem.name}"을 비활성화하시겠습니까?`)) return;
    try {
        await deactivateSemester(semesterId);
        if (selectedSemesterId === semesterId) selectedSemesterId = null;
        alert(`"${sem.name}"이 비활성화되었습니다.`);
        await loadSemesters();
    } catch (error) {
        console.error('학기 비활성화 오류:', error);
        alert('학기 비활성화 중 오류가 발생했습니다.');
    }
}

async function handleDeleteSemester(semesterId) {
    const sem = semesters.find(s => s.id === semesterId);
    if (!sem) return;
    if (!confirm(`"${sem.name}"을 삭제하시겠습니까?\n이 학기에 속한 타임이 있으면 삭제할 수 없습니다.`)) return;
    try {
        await deleteSemester(semesterId);
        if (selectedSemesterId === semesterId) selectedSemesterId = null;
        alert(`"${sem.name}"이 삭제되었습니다.`);
        await loadSemesters();
    } catch (error) {
        console.error('학기 삭제 오류:', error);
        alert(error.message || '학기 삭제 중 오류가 발생했습니다.');
    }
}

function showAddSemesterModal() {
    document.getElementById('semesterName').value = '';
    showModal('semesterModal');
}

function closeSemesterModal() {
    hideModal('semesterModal');
}

async function saveSemester() {
    const name = document.getElementById('semesterName').value.trim();
    if (!name) {
        alert('학기 이름을 입력해주세요. (예: 2025-2학기)');
        return;
    }
    const duplicate = semesters.find(s => s.name === name);
    if (duplicate) {
        alert('이미 동일한 이름의 학기가 존재합니다.');
        return;
    }
    try {
        await createSemester(name);
        alert(`"${name}" 학기가 추가되었습니다.`);
        closeSemesterModal();
        await loadSemesters();
    } catch (error) {
        console.error('학기 저장 오류:', error);
        alert('학기 저장 중 오류가 발생했습니다.');
    }
}

// ─────────────────────────────────────────────
// 타임 관리 (학기 카드 내 인라인)
// ─────────────────────────────────────────────

// 학기 카드에서 타임 추가 버튼 클릭
function showAddTimeModalForSemester(semId) {
    selectedSemesterId = semId;

    // 해당 학기의 타임 수 확인
    const semTimesEl = document.getElementById('timesOf_' + semId);
    const currentCount = semTimesEl
        ? semTimesEl.querySelectorAll('[id^=""]').length
        : 0;

    // times 배열에서 해당 학기 타임 수 확인
    const semTimes = times.filter(t => t.semester_id === semId);
    if (semTimes.length >= 6) {
        alert('최대 6개의 타임만 추가할 수 있습니다.');
        return;
    }

    currentEditingTime = null;
    selectedDatesForTime = [];

    document.getElementById('timeModalTitle').textContent = '타임 추가';
    document.getElementById('timeName').value = '';
    document.getElementById('dayOfWeek').value = '월';
    document.getElementById('timeRange').value = '';
    document.getElementById('selectedDatesDisplay').textContent = '선택된 날짜가 없습니다.';
    document.getElementById('selectedDateCount').textContent = '0';

    showModal('timeModal');
}

// 타임 수정 (학기 카드 내 수정 버튼)
async function editTime(timeId, semId) {
    if (semId) selectedSemesterId = semId;

    // times 캐시에 없으면 로드
    if (!times.find(t => t.id === timeId)) {
        try {
            const allT = await getData('times', { limit: 1000 });
            times = Array.isArray(allT) ? allT : [];
        } catch(e) {}
    }

    currentEditingTime = times.find(t => t.id === timeId);
    if (!currentEditingTime) {
        // 직접 조회
        try {
            const rows = await getData('times', { id: timeId, limit: 1 });
            currentEditingTime = rows[0] || null;
        } catch(e) {}
    }
    if (!currentEditingTime) return;

    selectedDatesForTime = Array.isArray(currentEditingTime.selected_dates)
        ? [...currentEditingTime.selected_dates]
        : [];

    document.getElementById('timeModalTitle').textContent = '타임 수정';
    document.getElementById('timeName').value = currentEditingTime.name || '';
    document.getElementById('dayOfWeek').value = currentEditingTime.day_of_week || '월';
    document.getElementById('timeRange').value = currentEditingTime.time_range || '';

    updateSelectedDatesDisplay();
    updateSelectedDateCount();

    showModal('timeModal');
}

async function saveTime() {
    const name = document.getElementById('timeName').value.trim();
    const dayOfWeek = document.getElementById('dayOfWeek').value;
    const timeRange = document.getElementById('timeRange').value.trim();

    if (!name) { alert('타임 이름을 입력해주세요.'); return; }
    if (!dayOfWeek) { alert('요일을 선택해주세요.'); return; }
    if (!timeRange) { alert('시간 범위를 입력해주세요. (예: 09:00-12:00)'); return; }

    try {
        const timeData = {
            name,
            day_of_week: dayOfWeek,
            time_range: timeRange,
            selected_dates: selectedDatesForTime,
            semester_id: selectedSemesterId
        };

        if (currentEditingTime) {
            timeData.id = currentEditingTime.id;
            await updateData('times', currentEditingTime.id, timeData);
            alert('타임이 수정되었습니다.');
        } else {
            timeData.id = generateUUID();
            await createData('times', timeData);
            alert('타임이 추가되었습니다.');
        }

        closeTimeModal();
        // 전체 times 캐시 갱신 후 학기 목록 재렌더링
        const allT = await getData('times', { limit: 1000 });
        times = Array.isArray(allT) ? allT : [];
        await loadSemesters();
    } catch (error) {
        console.error('타임 저장 오류:', error);
        alert('타임 저장 중 오류가 발생했습니다.');
    }
}

async function deleteTime(timeId) {
    try {
        const operatorsResponse = await getData('operators', { limit: 1000 });
        const allOperators = Array.isArray(operatorsResponse) ? operatorsResponse : [];
        const timeOperators = allOperators.filter(op => op.time_id === timeId);

        if (timeOperators.length > 0) {
            alert('이 타임에 속한 술자가 있습니다. 먼저 술자를 삭제하거나 다른 타임으로 이동시켜주세요.');
            return;
        }

        if (!showConfirm('정말 이 타임을 삭제하시겠습니까?')) return;

        await deleteData('times', timeId);
        alert('타임이 삭제되었습니다.');

        const allT = await getData('times', { limit: 1000 });
        times = Array.isArray(allT) ? allT : [];
        await loadSemesters();
    } catch (error) {
        console.error('타임 삭제 오류:', error);
        alert('타임 삭제 중 오류가 발생했습니다.');
    }
}

function closeTimeModal() {
    hideModal('timeModal');
    currentEditingTime = null;
    selectedDatesForTime = [];
}

// 날짜 선택기
function showDatePicker() {
    const dayOfWeek = document.getElementById('dayOfWeek').value;
    currentEditingTimeForDates = dayOfWeek;
    renderCalendar(dayOfWeek);
    showModal('datePickerModal');
}

function renderCalendar(dayOfWeek) {
    const container = document.getElementById('calendarContainer');
    const currentYear = new Date().getFullYear();
    const dayMap = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5 };
    const targetDay = dayMap[dayOfWeek];

    container.innerHTML = '<h4 style="text-align:center; margin-bottom:20px;">날짜를 선택하세요 (최대 13개)</h4>';

    for (let month = 1; month <= 12; month++) {
        const monthDiv = document.createElement('div');
        monthDiv.style.marginBottom = '30px';
        monthDiv.innerHTML = `<h5 style="color:var(--primary-color); margin-bottom:15px;">${currentYear}년 ${month}월</h5>`;

        const datesGrid = document.createElement('div');
        datesGrid.className = 'date-grid';

        const daysInMonth = new Date(currentYear, month, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, month - 1, day);
            const dateString = formatDate(date);
            if (date.getDay() === targetDay) {
                const dateButton = document.createElement('button');
                dateButton.className = 'date-button';
                dateButton.textContent = formatDateShort(dateString);
                if (selectedDatesForTime.includes(dateString)) dateButton.classList.add('selected');
                dateButton.onclick = () => toggleDateSelection(dateString, dateButton);
                datesGrid.appendChild(dateButton);
            }
        }

        if (datesGrid.children.length > 0) {
            monthDiv.appendChild(datesGrid);
            container.appendChild(monthDiv);
        }
    }

    updateSelectedDateCount();
}

function toggleDateSelection(dateString, button) {
    const index = selectedDatesForTime.indexOf(dateString);
    if (index > -1) {
        selectedDatesForTime.splice(index, 1);
        button.classList.remove('selected');
    } else {
        if (selectedDatesForTime.length >= 13) { alert('최대 13개의 날짜만 선택할 수 있습니다.'); return; }
        selectedDatesForTime.push(dateString);
        button.classList.add('selected');
    }
    updateSelectedDateCount();
}

function updateSelectedDateCount() {
    const countEl = document.getElementById('selectedDateCount');
    if (countEl) countEl.textContent = selectedDatesForTime.length;
}

function updateSelectedDatesDisplay() {
    const display = document.getElementById('selectedDatesDisplay');
    if (!display) return;
    if (selectedDatesForTime.length === 0) {
        display.textContent = '선택된 날짜가 없습니다.';
        display.style.color = 'var(--text-light)';
    } else {
        display.textContent = `${selectedDatesForTime.length}개의 날짜가 선택되었습니다.`;
        display.style.color = 'var(--primary-color)';
    }
}

function confirmDates() {
    if (selectedDatesForTime.length === 0) { alert('최소 1개 이상의 날짜를 선택해주세요.'); return; }
    selectedDatesForTime.sort();
    updateSelectedDatesDisplay();
    closeDatePicker();
}

function closeDatePicker() {
    hideModal('datePickerModal');
}

// ─────────────────────────────────────────────
// 술자 관리 탭
// ─────────────────────────────────────────────
async function showOperatorsManagement() {
    setActiveTab('술자 리스트 수정');
    hideAllManagementSections();
    document.getElementById('operatorsManagement').style.display = 'block';
    await loadOperators();
}

async function loadOperators() {
    showLoading('operatorsList');
    try {
        // 전체 학기 로드 (최신순)
        if (semesters.length === 0) {
            semesters = await getAllSemesters();
        }

        // 전체 타임/술자 로드
        const timesResponse = await getData('times', { limit: 1000 });
        times = Array.isArray(timesResponse) ? timesResponse : [];

        const operatorsResponse = await getData('operators', { limit: 1000 });
        operators = Array.isArray(operatorsResponse) ? operatorsResponse : [];

        displayOperators();
    } catch (error) {
        console.error('술자 로드 오류:', error);
        showError('operatorsList', '술자 데이터를 불러오는 중 오류가 발생했습니다.');
    }
}

function displayOperators() {
    const container = document.getElementById('operatorsList');

    if (semesters.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:40px; color:var(--text-light);">등록된 학기가 없습니다.</p>';
        return;
    }

    container.innerHTML = '';

    semesters.forEach(sem => {
        // 이 학기의 타임 목록 (최대 4개 열 표시)
        const semTimes = times.filter(t => t.semester_id === sem.id);

        const semBox = document.createElement('div');
        semBox.style.cssText = `
            border: 2px solid ${sem.is_active ? 'var(--primary-color)' : '#ddd'};
            border-radius: 12px;
            padding: 18px 20px;
            margin-bottom: 24px;
            background: ${sem.is_active ? '#f0f5ff' : '#fafafa'};
        `;

        // 헤더 행: 학기명 + 상태 배지
        const statusBadge = sem.is_active
            ? `<span style="background:var(--primary-color); color:#fff; padding:3px 10px; border-radius:20px; font-size:0.8em; font-weight:600; margin-left:10px;">✅ 활성</span>`
            : `<span style="background:#eee; color:#999; padding:3px 10px; border-radius:20px; font-size:0.8em; margin-left:10px;">비활성</span>`;

        // 타임별 술자 그리드 (4열)
        let timesGridHtml = '';
        if (semTimes.length === 0) {
            timesGridHtml = `<p style="color:var(--text-light); font-size:0.85em; margin-top:12px; padding:10px 0;">등록된 타임이 없습니다.</p>`;
        } else {
            // 최대 4개 컬럼 그리드
            const colWidth = semTimes.length <= 2 ? `${100 / semTimes.length}%` : '25%';
            const gridCols = Math.min(semTimes.length, 4);
            timesGridHtml = `
                <div style="display:grid; grid-template-columns:repeat(${gridCols}, 1fr); gap:10px; margin-top:14px;">
                    ${semTimes.map(time => {
                        const timeOps = operators.filter(op => op.time_id === time.id);
                        const opListHtml = timeOps.length === 0
                            ? `<p style="color:#bbb; font-size:0.75em; margin:4px 0 0; font-style:italic;">없음</p>`
                            : timeOps.map(op => `
                                <div style="display:flex; align-items:center; justify-content:space-between; font-size:0.75em; color:#333; padding:1px 0; line-height:1.5;">
                                    <span>${op.name || '-'} <span style="color:#888;">${op.student_id || ''}</span></span>
                                    <span style="white-space:nowrap; margin-left:4px;">
                                        <button onclick="editOperator('${op.id}')"
                                            style="background:none; border:none; color:var(--primary-color); cursor:pointer; font-size:0.85em; padding:0 2px;">수정</button>
                                        <button onclick="deleteOperator('${op.id}')"
                                            style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:0.85em; padding:0 2px;">삭제</button>
                                    </span>
                                </div>`).join('');

                        return `
                            <div style="background:#fff; border:1px solid #e0e8ff; border-radius:8px; padding:10px 12px; min-height:80px;">
                                <div style="font-weight:700; font-size:0.88em; color:var(--primary-color); border-bottom:1px solid #e8eeff; padding-bottom:6px; margin-bottom:6px;">
                                    ${time.name}
                                    <span style="font-weight:400; color:#888; font-size:0.88em; margin-left:4px;">${time.day_of_week}요일</span>
                                    <span style="float:right; font-size:0.8em; color:#aaa;">${timeOps.length}/12</span>
                                </div>
                                ${opListHtml}
                            </div>`;
                    }).join('')}
                </div>`;
        }

        semBox.innerHTML = `
            <div style="display:flex; align-items:center; margin-bottom:4px;">
                <h3 style="margin:0; font-size:1.05em; color:#333;">${sem.name}</h3>
                ${statusBadge}
            </div>
            ${timesGridHtml}`;

        container.appendChild(semBox);
    });
}

async function showAddOperatorModal() {
    if (semesters.length === 0) {
        // 학기 캐시 없으면 로드
        semesters = await getAllSemesters();
    }
    if (semesters.length === 0) {
        alert('등록된 학기가 없습니다. 학기 관리 탭에서 학기를 추가해주세요.');
        return;
    }

    currentEditingOperator = null;
    document.getElementById('operatorModalTitle').textContent = '술자 추가';
    document.getElementById('operatorName').value = '';
    document.getElementById('operatorStudentId').value = '';
    document.getElementById('operatorPhone').value = '';

    // 학기 select 표시 (추가 시만)
    const semGroup = document.getElementById('operatorSemesterGroup');
    if (semGroup) semGroup.style.display = 'block';

    // 학기 select 채우기 (최신순 = semesters 배열 순서)
    const semSelect = document.getElementById('operatorSemesterId');
    semSelect.innerHTML = '<option value="">학기를 선택하세요</option>';
    semesters.forEach(sem => {
        const opt = document.createElement('option');
        opt.value = sem.id;
        opt.textContent = sem.name + (sem.is_active ? ' (활성)' : '');
        semSelect.appendChild(opt);
    });

    // 타임 select 초기화
    const timeSelect = document.getElementById('operatorTimeId');
    timeSelect.innerHTML = '<option value="">학기를 먼저 선택하세요</option>';

    showModal('operatorModal');
}

// 술자 추가 모달에서 학기 선택 시 해당 학기의 타임 동적 로드
async function onOperatorSemesterChange() {
    const semId = document.getElementById('operatorSemesterId').value;
    const timeSelect = document.getElementById('operatorTimeId');
    timeSelect.innerHTML = '<option value="">타임을 선택하세요</option>';

    if (!semId) {
        timeSelect.innerHTML = '<option value="">학기를 먼저 선택하세요</option>';
        return;
    }

    try {
        const semTimes = await getData('times', { semester_id: semId, limit: 1000 });
        const timesForSem = Array.isArray(semTimes) ? semTimes : [];

        if (timesForSem.length === 0) {
            timeSelect.innerHTML = '<option value="">이 학기에 타임이 없습니다</option>';
            return;
        }

        timesForSem.forEach(time => {
            const opCount = operators.filter(op => op.time_id === time.id).length;
            const opt = document.createElement('option');
            opt.value = time.id;
            opt.textContent = `${time.name} (${time.day_of_week}요일 ${time.time_range}) — ${opCount}/12명`;
            if (opCount >= 12) { opt.disabled = true; opt.textContent += ' (정원 초과)'; }
            timeSelect.appendChild(opt);
        });
    } catch (e) {
        console.error('타임 로드 오류:', e);
        timeSelect.innerHTML = '<option value="">타임 로드 실패</option>';
    }
}

function editOperator(operatorId) {
    currentEditingOperator = operators.find(op => op.id === operatorId);
    if (!currentEditingOperator) return;

    document.getElementById('operatorModalTitle').textContent = '술자 수정';
    document.getElementById('operatorName').value = currentEditingOperator.name || '';
    document.getElementById('operatorStudentId').value = currentEditingOperator.student_id || '';
    document.getElementById('operatorPhone').value = currentEditingOperator.phone || '';

    // 수정 시 학기 select 숨기기 (타임만 변경 가능)
    const semGroup = document.getElementById('operatorSemesterGroup');
    if (semGroup) semGroup.style.display = 'none';

    // 해당 술자의 학기에 속하는 타임만 표시
    const opSemId = currentEditingOperator.semester_id;
    const semTimesForEdit = opSemId
        ? times.filter(t => t.semester_id === opSemId)
        : times;

    const timeSelect = document.getElementById('operatorTimeId');
    timeSelect.innerHTML = '';
    semTimesForEdit.forEach(time => {
        const option = document.createElement('option');
        option.value = time.id;
        option.textContent = `${time.name} (${time.day_of_week}요일 ${time.time_range})`;
        if (time.id === currentEditingOperator.time_id) option.selected = true;
        timeSelect.appendChild(option);
    });

    showModal('operatorModal');
}

async function saveOperator() {
    const name = document.getElementById('operatorName').value.trim();
    const studentId = document.getElementById('operatorStudentId').value.trim();
    const phone = document.getElementById('operatorPhone').value.trim();
    const timeId = document.getElementById('operatorTimeId').value;

    if (!name) { alert('이름을 입력해주세요.'); return; }
    if (!studentId) { alert('학번을 입력해주세요.'); return; }
    if (!phone) { alert('전화번호를 입력해주세요.'); return; }

    // 추가 시에는 학기 선택 필수
    if (!currentEditingOperator) {
        const semId = document.getElementById('operatorSemesterId').value;
        if (!semId) { alert('학기를 선택해주세요.'); return; }
    }

    if (!timeId) { alert('타임을 선택해주세요.'); return; }

    if (!currentEditingOperator) {
        if (operators.filter(op => op.time_id === timeId).length >= 12) {
            alert('한 타임당 최대 12명의 술자만 추가할 수 있습니다.'); return;
        }
    } else if (currentEditingOperator.time_id !== timeId) {
        if (operators.filter(op => op.time_id === timeId).length >= 12) {
            alert('해당 타임은 이미 12명의 술자가 등록되어 있습니다.'); return;
        }
    }

    try {
        // 추가 시: 선택한 학기 ID / 수정 시: 기존 학기 ID 유지
        const semId = currentEditingOperator
            ? currentEditingOperator.semester_id
            : document.getElementById('operatorSemesterId').value;

        const operatorData = {
            name, student_id: studentId,
            phone: formatPhone(phone),
            time_id: timeId,
            semester_id: semId || selectedSemesterId
        };

        if (currentEditingOperator) {
            operatorData.id = currentEditingOperator.id;
            await updateData('operators', currentEditingOperator.id, operatorData);
            alert('술자가 수정되었습니다.');
        } else {
            operatorData.id = generateUUID();
            await createData('operators', operatorData);
            alert('술자가 추가되었습니다.');
        }

        closeOperatorModal();
        await loadOperators();
    } catch (error) {
        console.error('술자 저장 오류:', error);
        alert('술자 저장 중 오류가 발생했습니다.');
    }
}

async function deleteOperator(operatorId) {
    try {
        const allReservations = Array.isArray(await getData('reservations', { limit: 5000 }))
            ? await getData('reservations', { limit: 5000 }) : [];
        const operatorReservations = allReservations.filter(r => r.operator_id === operatorId);

        if (operatorReservations.length > 0) {
            if (!confirm(`이 술자에게 ${operatorReservations.length}개의 예약이 있습니다. 정말 삭제하시겠습니까? (예약도 함께 삭제됩니다)`)) return;
            for (const r of operatorReservations) await deleteData('reservations', r.id);
        } else {
            if (!confirm('정말 이 술자를 삭제하시겠습니까?')) return;
        }

        await deleteData('operators', operatorId);
        alert('술자가 삭제되었습니다.');
        await loadOperators();
    } catch (error) {
        console.error('술자 삭제 오류:', error);
        alert('술자 삭제 중 오류가 발생했습니다.');
    }
}

function closeOperatorModal() {
    hideModal('operatorModal');
    currentEditingOperator = null;
}

// ─────────────────────────────────────────────
// 예약 관리 탭
// ─────────────────────────────────────────────
async function showReservationsManagement() {
    setActiveTab('예약 관리');
    hideAllManagementSections();
    document.getElementById('reservationsManagement').style.display = 'block';
    await loadReservationsSummary();
}

function navigateToReservationCheck() {
    window.location.href = '/reservation-check.html';
}

async function loadReservationsSummary() {
    try {
        // 전체 데이터 로드
        const [allSems, allTimesRaw, allOpsRaw, allReservationsRaw] = await Promise.all([
            getAllSemesters(),
            getData('times',        { limit: 1000 }),
            getData('operators',    { limit: 1000 }),
            getData('reservations', { limit: 5000 })
        ]);

        const allTimes2        = Array.isArray(allTimesRaw)        ? allTimesRaw        : [];
        const allOps2          = Array.isArray(allOpsRaw)          ? allOpsRaw          : [];
        const allReservations2 = Array.isArray(allReservationsRaw) ? allReservationsRaw : [];

        // 전체 예약 수 뱃지
        const countElement = document.getElementById('currentReservationCount');
        if (countElement) countElement.textContent = allReservations2.length;

        const summaryContainer = document.getElementById('reservationsSummary');
        if (!summaryContainer) return;

        if (allReservations2.length === 0 && allSems.length === 0) {
            summaryContainer.innerHTML = `<div class="notice-box" style="text-align:center; padding:40px;"><p>현재 예약이 없습니다.</p></div>`;
            return;
        }

        // operator_id → time_id 맵
        const opTimeMap = {};
        allOps2.forEach(op => { opTimeMap[op.id] = op.time_id; });

        // time_id → semester_id 맵
        const timeSemMap = {};
        allTimes2.forEach(t => { timeSemMap[t.id] = t.semester_id; });

        // 학기별 처리 (최신순)
        let html = '';

        allSems.forEach(sem => {
            const isActive = sem.is_active;
            const semTimes = allTimes2.filter(t => t.semester_id === sem.id);

            // 이 학기에 속한 예약 (operator → time → semester 경로)
            const semReservations = allReservations2.filter(r => {
                const tid = opTimeMap[r.operator_id] || r.time_id;
                return timeSemMap[tid] === sem.id;
            });

            // 색상 테마
            const borderColor = isActive ? 'var(--primary-color)' : '#ccc';
            const bgColor     = isActive ? '#f0f5ff' : '#f8f8f8';
            const titleColor  = isActive ? 'var(--primary-color)' : '#888';
            const badgeHtml   = isActive
                ? `<span style="background:var(--primary-color);color:#fff;padding:2px 10px;border-radius:20px;font-size:0.78em;font-weight:600;margin-left:8px;">활성</span>`
                : `<span style="background:#ddd;color:#888;padding:2px 10px;border-radius:20px;font-size:0.78em;margin-left:8px;">비활성</span>`;

            // 타임별 예약 수
            let timeCols = '';
            if (semTimes.length === 0) {
                timeCols = `<p style="color:#bbb;font-size:0.85em;margin:8px 0 0;">등록된 타임 없음</p>`;
            } else {
                const gridCols = Math.min(semTimes.length, 4);
                timeCols = `<div style="display:grid;grid-template-columns:repeat(${gridCols},1fr);gap:10px;margin-top:12px;">`;
                semTimes.forEach(time => {
                    const timeReservations = semReservations.filter(r => {
                        const tid = opTimeMap[r.operator_id] || r.time_id;
                        return tid === time.id;
                    });
                    const cnt = timeReservations.length;
                    timeCols += `
                        <div style="padding:12px;background:#fff;border:1px solid ${isActive ? '#c7d9ff' : '#e0e0e0'};border-radius:8px;text-align:center;">
                            <div style="font-weight:600;font-size:0.88em;color:${titleColor};margin-bottom:4px;">${time.name}</div>
                            <div style="font-size:0.78em;color:#999;margin-bottom:8px;">${time.day_of_week}요일 ${time.time_range}</div>
                            <div style="font-size:1.4em;font-weight:700;color:${isActive ? 'var(--primary-color)' : '#aaa'};">${cnt}<span style="font-size:0.55em;font-weight:400;margin-left:2px;">건</span></div>
                        </div>`;
                });
                timeCols += `</div>`;
            }

            html += `
                <div style="border:2px solid ${borderColor};border-radius:12px;padding:16px 20px;margin-bottom:20px;background:${bgColor};">
                    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">
                        <div style="display:flex;align-items:center;">
                            <h4 style="margin:0;color:${titleColor};font-size:1em;">${sem.name} 타임별 예약 현황</h4>
                            ${badgeHtml}
                        </div>
                        <div style="font-size:0.88em;color:${isActive ? 'var(--primary-color)' : '#999'};font-weight:600;">
                            학기 총 <strong>${semReservations.length}</strong>건
                        </div>
                    </div>
                    ${timeCols}
                </div>`;
        });

        // 학기 미분류 예약 (semester_id 없는 times에 속한 예약)
        const classifiedReservationIds = new Set();
        allSems.forEach(sem => {
            const semTimes = allTimes2.filter(t => t.semester_id === sem.id);
            allReservations2.forEach(r => {
                const tid = opTimeMap[r.operator_id] || r.time_id;
                if (semTimes.some(t => t.id === tid)) classifiedReservationIds.add(r.id);
            });
        });
        const unclassified = allReservations2.filter(r => !classifiedReservationIds.has(r.id));
        if (unclassified.length > 0) {
            html += `
                <div style="border:1px dashed #ccc;border-radius:12px;padding:14px 18px;margin-bottom:16px;background:#fafafa;">
                    <div style="display:flex;align-items:center;justify-content:space-between;">
                        <h4 style="margin:0;color:#999;font-size:0.95em;">학기 미분류 예약</h4>
                        <span style="font-size:0.88em;color:#aaa;">총 ${unclassified.length}건</span>
                    </div>
                </div>`;
        }

        if (!html) {
            summaryContainer.innerHTML = `<div class="notice-box" style="text-align:center; padding:40px;"><p>현재 예약이 없습니다.</p></div>`;
        } else {
            summaryContainer.innerHTML = html;
        }

    } catch (error) {
        console.error('예약 요약 로드 오류:', error);
        const el = document.getElementById('reservationsSummary');
        if (el) el.innerHTML = `<div class="warning-box" style="text-align:center;"><p>예약 정보를 불러오는 중 오류가 발생했습니다.</p></div>`;
    }
}

async function deleteAllReservations() {
    if (!confirm('⚠️ 정말로 모든 예약을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다!')) return;
    if (!confirm('⚠️⚠️ 최종 확인: 모든 예약 데이터가 영구적으로 삭제됩니다.\n\n계속하시겠습니까?')) return;

    try {
        const response = await getData('reservations', { limit: 5000 });
        const reservations = Array.isArray(response) ? response : [];
        if (reservations.length === 0) { alert('삭제할 예약이 없습니다.'); return; }

        let deletedCount = 0;
        for (const r of reservations) {
            try { await deleteData('reservations', r.id); deletedCount++; } catch(e) {}
        }

        alert(`총 ${deletedCount}개의 예약이 삭제되었습니다.`);
        await loadReservationsSummary();
    } catch (error) {
        console.error('전체 예약 삭제 오류:', error);
        alert('예약 삭제 중 오류가 발생했습니다.');
    }
}

// ─────────────────────────────────────────────
// 페이지 로드 시
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') authenticate();
        });
    }
});
