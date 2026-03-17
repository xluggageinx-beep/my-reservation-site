// 술자모드 페이지 로직

const OPERATOR_PASSWORD = '0814';

let isAuthenticated = false;
let times = [];
let operators = [];
let reservations = [];
let currentEditingTime = null;
let currentEditingOperator = null;
let selectedDatesForTime = [];

function setActiveTab(tabName) {
    const tabButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
        const text = (btn.textContent || '').trim();
        return ['타임 수정', '술자 리스트 수정', '예약 관리', '예약 정보 확인'].includes(text);
    });

    tabButtons.forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
    });

    const target = tabButtons.find(btn => (btn.textContent || '').trim() === tabName);
    if (target) {
        target.classList.remove('btn-secondary');
        target.classList.add('btn-primary');
    }
}

async function authenticate() {
    const passwordInput = document.getElementById('password');
    const password = passwordInput ? passwordInput.value.trim() : '';

    if (password === OPERATOR_PASSWORD) {
        isAuthenticated = true;
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('manageSection').style.display = 'block';
        await showTimesManagement();
    } else {
        alert('패스워드가 올바르지 않습니다.');
        if (passwordInput) passwordInput.value = '';
    }
}

async function showTimesManagement() {
    setActiveTab('타임 수정');
    document.getElementById('timesManagement').style.display = 'block';
    document.getElementById('operatorsManagement').style.display = 'none';

    const reservationsManagement = document.getElementById('reservationsManagement');
    if (reservationsManagement) reservationsManagement.style.display = 'none';

    await loadTimes();
}

async function showOperatorsManagement() {
    setActiveTab('술자 리스트 수정');
    document.getElementById('timesManagement').style.display = 'none';
    document.getElementById('operatorsManagement').style.display = 'block';

    const reservationsManagement = document.getElementById('reservationsManagement');
    if (reservationsManagement) reservationsManagement.style.display = 'none';

    await loadOperators();
}

async function showReservationsManagement() {
    setActiveTab('예약 관리');
    document.getElementById('timesManagement').style.display = 'none';
    document.getElementById('operatorsManagement').style.display = 'none';

    const reservationsManagement = document.getElementById('reservationsManagement');
    if (reservationsManagement) reservationsManagement.style.display = 'block';

    await loadReservationsSummary();
}

function navigateToReservationCheck() {
    setActiveTab('예약 정보 확인');
    window.location.href = 'reservation-check.html';
}

async function loadTimes() {
    const container = document.getElementById('timesList');
    if (!container) return;

    showLoading('timesList');

    try {
        times = await getData('times', {
            limit: 100,
            order: 'created_at.asc,name.asc'
        });

        const countElement = document.getElementById('currentTimeCount');
        if (countElement) countElement.textContent = times.length;

        const addTimeBtn = document.getElementById('addTimeBtn');
        if (addTimeBtn) {
            if (times.length >= 6) {
                addTimeBtn.disabled = true;
                addTimeBtn.textContent = '타임 추가 (최대 6개)';
            } else {
                addTimeBtn.disabled = false;
                addTimeBtn.textContent = '타임 추가';
            }
        }

        displayTimes();
    } catch (error) {
        console.error('타임 로드 오류:', error);
        container.innerHTML = `
            <div class="warning-box" style="text-align: center; padding: 30px;">
                <p><strong>타임 데이터를 불러오는 중 오류가 발생했습니다.</strong></p>
                <p style="margin-top: 10px; font-size: 0.9em; color: var(--text-light);">
                    페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
                </p>
                <button class="btn btn-primary" onclick="loadTimes()" style="margin-top: 15px;">
                    다시 시도
                </button>
            </div>
        `;
    }
}

function displayTimes() {
    const container = document.getElementById('timesList');
    if (!container) return;

    if (times.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-light);">등록된 타임이 없습니다.</p>';
        return;
    }

    container.innerHTML = '';

    times.forEach(time => {
        const timeCard = document.createElement('div');
        timeCard.className = 'time-card';

        const datesCount = Array.isArray(time.selected_dates) ? time.selected_dates.length : 0;
        const datesInfo = datesCount > 0 ? `${datesCount}개 날짜 선택됨` : '날짜 미선택';

        timeCard.innerHTML = `
            <h3>${time.name}</h3>
            <div class="time-info">
                <p><strong>요일:</strong> ${time.day_of_week}요일</p>
                <p><strong>시간:</strong> ${time.time_range}</p>
                <p><strong>주차 정보:</strong> ${datesInfo}</p>
            </div>
            <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="btn btn-secondary" style="padding: 10px 20px; font-size: 0.9em;" onclick="editTime('${time.id}')">수정</button>
                <button class="btn btn-danger" style="padding: 10px 20px; font-size: 0.9em;" onclick="deleteTime('${time.id}')">삭제</button>
            </div>
        `;

        container.appendChild(timeCard);
    });
}

function showAddTimeModal() {
    if (times.length >= 6) {
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

function editTime(timeId) {
    currentEditingTime = times.find(t => t.id === timeId);
    if (!currentEditingTime) return;

    selectedDatesForTime = Array.isArray(currentEditingTime.selected_dates)
        ? [...currentEditingTime.selected_dates]
        : [];

    document.getElementById('timeModalTitle').textContent = '타임 수정';
    document.getElementById('timeName').value = currentEditingTime.name || '';
    document.getElementById('dayOfWeek').value = currentEditingTime.day_of_week || '월';
    document.getElementById('timeRange').value = currentEditingTime.time_range || '';

    updateSelectedDatesDisplay();
    document.getElementById('selectedDateCount').textContent = selectedDatesForTime.length;

    showModal('timeModal');
}

async function saveTime() {
    const name = document.getElementById('timeName').value.trim();
    const dayOfWeek = document.getElementById('dayOfWeek').value;
    const timeRange = document.getElementById('timeRange').value.trim();

    if (!name) {
        alert('타임 이름을 입력해주세요.');
        return;
    }

    if (!timeRange) {
        alert('시간 범위를 입력해주세요.');
        return;
    }

    try {
        const timeData = {
            name,
            day_of_week: dayOfWeek,
            time_range: timeRange,
            selected_dates: selectedDatesForTime
        };

        if (currentEditingTime) {
            await updateData('times', currentEditingTime.id, timeData);
            alert('타임이 수정되었습니다.');
        } else {
            if (times.length >= 6) {
                alert('최대 6개의 타임만 추가할 수 있습니다.');
                return;
            }
            timeData.id = generateUUID();
            await createData('times', timeData);
            alert('타임이 추가되었습니다.');
        }

        closeTimeModal();
        await loadTimes();
    } catch (error) {
        console.error('타임 저장 오류:', error);
        alert('타임 저장 중 오류가 발생했습니다.');
    }
}

async function deleteTime(timeId) {
    try {
        const allOperators = await getData('operators', { limit: 1000 });
        const timeOperators = allOperators.filter(op => op.time_id === timeId);

        if (timeOperators.length > 0) {
            alert('이 타임에 속한 술자가 있습니다. 먼저 술자를 삭제하거나 다른 타임으로 이동시켜주세요.');
            return;
        }

        if (!showConfirm('정말 이 타임을 삭제하시겠습니까?')) return;

        await deleteData('times', timeId);
        alert('타임이 삭제되었습니다.');
        await loadTimes();
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

function showDatePicker() {
    const dayOfWeek = document.getElementById('dayOfWeek').value;
    renderCalendar(dayOfWeek);
    showModal('datePickerModal');
}

function renderCalendar(dayOfWeek) {
    const container = document.getElementById('calendarContainer');
    const currentYear = new Date().getFullYear();
    const dayMap = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5 };
    const targetDay = dayMap[dayOfWeek];

    container.innerHTML = '<h4 style="text-align: center; margin-bottom: 20px;">날짜를 선택하세요 (최대 13개)</h4>';

    for (let month = 1; month <= 12; month++) {
        const monthDiv = document.createElement('div');
        monthDiv.style.marginBottom = '30px';
        monthDiv.innerHTML = `<h5 style="color: var(--primary-color); margin-bottom: 15px;">${currentYear}년 ${month}월</h5>`;

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

                if (selectedDatesForTime.includes(dateString)) {
                    dateButton.classList.add('selected');
                }

                dateButton.onclick = () => toggleDateSelection(dateString, dateButton);
                datesGrid.appendChild(dateButton);
            }
        }

        if (datesGrid.children.length > 0) {
            monthDiv.appendChild(datesGrid);
            container.appendChild(monthDiv);
        }
    }

    document.getElementById('selectedDateCount').textContent = selectedDatesForTime.length;
}

function toggleDateSelection(dateString, button) {
    const index = selectedDatesForTime.indexOf(dateString);

    if (index > -1) {
        selectedDatesForTime.splice(index, 1);
        button.classList.remove('selected');
    } else {
        if (selectedDatesForTime.length >= 13) {
            alert('최대 13개의 날짜만 선택할 수 있습니다.');
            return;
        }
        selectedDatesForTime.push(dateString);
        button.classList.add('selected');
    }

    document.getElementById('selectedDateCount').textContent = selectedDatesForTime.length;
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
    selectedDatesForTime.sort();
    updateSelectedDatesDisplay();
    closeDatePicker();
}

function closeDatePicker() {
    hideModal('datePickerModal');
}

async function loadOperators() {
    showLoading('operatorsList');

    try {
        operators = await getData('operators', {
            limit: 1000,
            order: 'created_at.asc,name.asc'
        });

        times = await getData('times', {
            limit: 100,
            order: 'created_at.asc,name.asc'
        });

        displayOperators();
    } catch (error) {
        console.error('술자 로드 오류:', error);
        showError('operatorsList', '술자 데이터를 불러오는 중 오류가 발생했습니다.');
    }
}

function displayOperators() {
    const container = document.getElementById('operatorsList');
    if (!container) return;

    if (operators.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-light);">등록된 술자가 없습니다.</p>';
        return;
    }

    let tableHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>이름</th>
                    <th>학번</th>
                    <th>전화번호</th>
                    <th>타임</th>
                    <th>관리</th>
                </tr>
            </thead>
            <tbody>
    `;

    operators.forEach(operator => {
        const time = times.find(t => t.id === operator.time_id);
        const timeName = time ? time.name : '미지정';

        tableHTML += `
            <tr>
                <td>${operator.name}</td>
                <td>${operator.student_id}</td>
                <td>${operator.phone}</td>
                <td>${timeName}</td>
                <td>
                    <button onclick="editOperator('${operator.id}')" style="background-color: var(--primary-color); color: white;">수정</button>
                    <button onclick="deleteOperator('${operator.id}')" style="background-color: var(--danger); color: white;">삭제</button>
                </td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    container.innerHTML = tableHTML;
}

function showAddOperatorModal() {
    if (times.length === 0) {
        alert('먼저 타임을 추가해주세요.');
        return;
    }

    currentEditingOperator = null;

    document.getElementById('operatorModalTitle').textContent = '술자 추가';
    document.getElementById('operatorName').value = '';
    document.getElementById('operatorStudentId').value = '';
    document.getElementById('operatorPhone').value = '';

    const timeSelect = document.getElementById('operatorTimeId');
    timeSelect.innerHTML = '';

    times.forEach(time => {
        const timeOperatorsCount = operators.filter(op => op.time_id === time.id).length;
        const option = document.createElement('option');
        option.value = time.id;
        option.textContent = `${time.name} (${time.day_of_week}요일 ${time.time_range}) - ${timeOperatorsCount}/12명`;

        if (timeOperatorsCount >= 12) {
            option.disabled = true;
            option.textContent += ' (정원 초과)';
        }

        timeSelect.appendChild(option);
    });

    showModal('operatorModal');
}

function editOperator(operatorId) {
    currentEditingOperator = operators.find(op => op.id === operatorId);
    if (!currentEditingOperator) return;

    document.getElementById('operatorModalTitle').textContent = '술자 수정';
    document.getElementById('operatorName').value = currentEditingOperator.name || '';
    document.getElementById('operatorStudentId').value = currentEditingOperator.student_id || '';
    document.getElementById('operatorPhone').value = currentEditingOperator.phone || '';

    const timeSelect = document.getElementById('operatorTimeId');
    timeSelect.innerHTML = '';

    times.forEach(time => {
        const timeOperatorsCount = operators.filter(op => op.time_id === time.id).length;
        const option = document.createElement('option');
        option.value = time.id;
        option.textContent = `${time.name} (${time.day_of_week}요일 ${time.time_range}) - ${timeOperatorsCount}/12명`;

        if (time.id === currentEditingOperator.time_id) {
            option.selected = true;
        }

        timeSelect.appendChild(option);
    });

    showModal('operatorModal');
}

async function saveOperator() {
    const name = document.getElementById('operatorName').value.trim();
    const studentId = document.getElementById('operatorStudentId').value.trim();
    const phone = document.getElementById('operatorPhone').value.trim();
    const timeId = document.getElementById('operatorTimeId').value;

    if (!name) {
        alert('이름을 입력해주세요.');
        return;
    }

    if (!studentId) {
        alert('학번을 입력해주세요.');
        return;
    }

    if (!phone) {
        alert('전화번호를 입력해주세요.');
        return;
    }

    if (!timeId) {
        alert('타임을 선택해주세요.');
        return;
    }

    if (!currentEditingOperator) {
        const timeOperatorsCount = operators.filter(op => op.time_id === timeId).length;
        if (timeOperatorsCount >= 12) {
            alert('한 타임당 최대 12명의 술자만 추가할 수 있습니다.');
            return;
        }
    } else if (currentEditingOperator.time_id !== timeId) {
        const timeOperatorsCount = operators.filter(op => op.time_id === timeId).length;
        if (timeOperatorsCount >= 12) {
            alert('해당 타임은 이미 12명의 술자가 등록되어 있습니다.');
            return;
        }
    }

    try {
        const operatorData = {
            name,
            student_id: studentId,
            phone: formatPhone(phone),
            time_id: timeId
        };

        if (currentEditingOperator) {
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
        const allReservations = await getData('reservations', { limit: 5000 });
        const operatorReservations = allReservations.filter(r => r.operator_id === operatorId);

        if (operatorReservations.length > 0) {
            if (!confirm(`이 술자에게 ${operatorReservations.length}개의 예약이 있습니다. 정말 삭제하시겠습니까? (예약도 함께 삭제됩니다)`)) {
                return;
            }

            for (const reservation of operatorReservations) {
                await deleteData('reservations', reservation.id);
            }
        } else {
            if (!confirm('정말 이 술자를 삭제하시겠습니까?')) {
                return;
            }
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

async function loadReservationsSummary() {
    try {
        reservations = await getData('reservations', { limit: 5000 });

        const countElement = document.getElementById('currentReservationCount');
        if (countElement) countElement.textContent = reservations.length;

        const summaryContainer = document.getElementById('reservationsSummary');
        if (!summaryContainer) return;

        if (reservations.length === 0) {
            summaryContainer.innerHTML = `
                <div class="notice-box" style="text-align: center; padding: 40px;">
                    <p>현재 예약이 없습니다.</p>
                </div>
            `;
            return;
        }

        const allTimes = await getData('times', { limit: 1000 });
        const timeStats = {};

        reservations.forEach(r => {
            const time = allTimes.find(t => t.id === r.time_id);
            const timeName = time ? time.name : '알수없음';
            if (!timeStats[timeName]) timeStats[timeName] = 0;
            timeStats[timeName]++;
        });

        let html = '<div class="time-card">';
        html += '<h4 style="color: var(--primary-color);">타임별 예약 현황</h4>';
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">';

        for (const [timeName, count] of Object.entries(timeStats)) {
            html += `
                <div style="padding: 15px; background-color: #f8f9fa; border-radius: 5px; text-align: center;">
                    <div style="font-weight: 600; margin-bottom: 5px;">${timeName}</div>
                    <div style="font-size: 1.5em; color: var(--primary-color);">${count}건</div>
                </div>
            `;
        }

        html += '</div></div>';
        summaryContainer.innerHTML = html;
    } catch (error) {
        console.error('예약 요약 로드 오류:', error);
        const summaryContainer = document.getElementById('reservationsSummary');
        if (summaryContainer) {
            summaryContainer.innerHTML = `
                <div class="warning-box" style="text-align: center;">
                    <p>예약 정보를 불러오는 중 오류가 발생했습니다.</p>
                </div>
            `;
        }
    }
}

async function deleteAllReservations() {
    if (!confirm('⚠️ 정말로 모든 예약을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다!')) return;
    if (!confirm('⚠️⚠️ 최종 확인: 모든 예약 데이터가 영구적으로 삭제됩니다.\n\n계속하시겠습니까?')) return;

    try {
        const allReservations = await getData('reservations', { limit: 5000 });

        if (allReservations.length === 0) {
            alert('삭제할 예약이 없습니다.');
            return;
        }

        let deletedCount = 0;
        for (const reservation of allReservations) {
            try {
                await deleteData('reservations', reservation.id);
                deletedCount++;
            } catch (error) {
                console.error(`예약 ${reservation.id} 삭제 오류:`, error);
            }
        }

        alert(`총 ${deletedCount}개의 예약이 삭제되었습니다.`);
        await loadReservationsSummary();
    } catch (error) {
        console.error('전체 예약 삭제 오류:', error);
        alert('예약 삭제 중 오류가 발생했습니다.');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') authenticate();
        });
    }
});
