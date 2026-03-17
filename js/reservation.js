// 예약 날짜 선택 페이지 로직 전문
let currentTime = null;
let currentOperator = null;
let reservedDates = [];
let selectedDate = null;

const dayIndexMap = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 };

async function loadReservationData() {
    const tid = sessionStorage.getItem('selectedTimeId');
    const oid = sessionStorage.getItem('selectedOperatorId');
    
    // 세션 체크: 정보 없으면 처음으로 (보안 로직)
    if (!tid || !oid) {
        alert('잘못된 접근입니다. 처음부터 다시 시작해주세요.');
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const [timeData, operatorData, allReservations] = await Promise.all([
            getRecord('times', tid),
            getRecord('operators', oid),
            getData('reservations')
        ]);

        currentTime = timeData;
        currentOperator = operatorData;
        // 특정 술자의 예약된 날짜 필터링
        reservedDates = (allReservations || [])
            .filter(r => String(r.operator_id) === String(oid))
            .map(r => r.reservation_date);
        
        displayReservationHeader();
        renderDateGrid();
    } catch (e) {
        console.error('데이터 로딩 실패:', e);
    }
}

function displayReservationHeader() {
    const header = document.getElementById('operatorInfo');
    if (header) {
        header.innerHTML = `
            <div class="time-card" style="margin-bottom:20px;">
                <h3>${currentTime.name}</h3>
                <p><strong>담당 술자:</strong> ${currentOperator.name} 학생</p>
                <p><strong>요일/시간:</strong> ${currentTime.day_of_week}요일 / ${currentTime.time_range}</p>
            </div>
        `;
    }
}

function renderDateGrid() {
    const grid = document.getElementById('dateGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDayIndex = dayIndexMap[currentTime.day_of_week];

    let foundDates = 0;
    // 향후 45일간 탐색하여 해당 요일 찾기
    for (let i = 0; i < 45; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        
        if (d.getDay() === targetDayIndex) {
            const dateStr = d.toISOString().split('T')[0];
            const isReserved = reservedDates.includes(dateStr);
            
            const btn = document.createElement('button');
            // 원본 클래스명 'date-button' 및 상태 'reserved' 적용
            btn.className = `date-button ${isReserved ? 'reserved' : ''}`;
            btn.disabled = isReserved;
            
            btn.innerHTML = `
                <div class="date-month">${d.getMonth() + 1}월</div>
                <div class="date-day">${d.getDate()}</div>
                <div class="date-status">${isReserved ? '예약완료' : '예약가능'}</div>
            `;
            
            if (!isReserved) {
                btn.onclick = () => {
                    selectedDate = dateStr;
                    document.getElementById('modalDate').innerText = dateStr;
                    document.getElementById('confirmModal').classList.add('active');
                };
            }
            grid.appendChild(btn);
            foundDates++;
            if (foundDates >= 4) break; // 최대 4개 날짜 표시
        }
    }
}

async function finalConfirm() {
    const btn = document.getElementById('confirmBtn');
    if(btn) btn.disabled = true; // 중복 클릭 방지

    const reservationData = {
        id: Math.random().toString(36).substr(2, 9),
        participant_name: sessionStorage.getItem('participantName'),
        participant_phone: sessionStorage.getItem('participantPhone'),
        participant_birthdate: sessionStorage.getItem('participantBirthdate'),
        participant_gender: sessionStorage.getItem('participantGender'),
        participant_address: sessionStorage.getItem('participantAddress'),
        participant_occupation: sessionStorage.getItem('participantOccupation'),
        participant_relationship: sessionStorage.getItem('participantRelationship'),
        operator_id: sessionStorage.getItem('selectedOperatorId'),
        time_id: sessionStorage.getItem('selectedTimeId'),
        reservation_date: selectedDate,
        created_at: new Date().toISOString()
    };
    
    try {
        await createData('reservations', reservationData);
        window.location.href = 'success.html';
    } catch (e) {
        alert('예약 저장 중 오류가 발생했습니다.');
        if(btn) btn.disabled = false;
    }
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
}

document.addEventListener('DOMContentLoaded', loadReservationData);
