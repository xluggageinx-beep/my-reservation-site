// 예약 날짜 선택 페이지 로직 전문

let currentTime = null;
let currentOperator = null;
let reservedDates = [];
let selectedDate = null;

const dayOrderMap = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 };

/**
 * 데이터 로드
 */
async function loadReservationData() {
    const timeId = sessionStorage.getItem('selectedTimeId');
    const operatorId = sessionStorage.getItem('selectedOperatorId');
    
    showLoading('dateGrid');
    
    try {
        // 1. 정보 로드
        currentTime = await getRecord('times', timeId);
        currentOperator = await getRecord('operators', operatorId);
        
        // 2. 예약된 날짜 로드
        const allRes = await getData('reservations');
        reservedDates = (allRes || [])
            .filter(r => String(r.operator_id) === String(operatorId))
            .map(r => r.reservation_date);

        displayReservationInfo();
        displayAvailableDates();
    } catch (error) {
        showError('dateGrid', '날짜 데이터를 불러오는 데 실패했습니다.');
    }
}

function displayReservationInfo() {
    const container = document.getElementById('operatorInfo');
    if (container && currentTime && currentOperator) {
        container.innerHTML = `
            <div class="selected-info-card" style="background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                <p style="margin-bottom: 5px;"><strong>담당 술자:</strong> ${currentOperator.name}</p>
                <p><strong>실습 타임:</strong> ${currentTime.name} (${currentTime.day_of_week}요일 / ${currentTime.time_range})</p>
            </div>
        `;
    }
}

/**
 * 날짜 그리드 표시 (데이터 오류 해결 핵심)
 */
function displayAvailableDates() {
    const grid = document.getElementById('dateGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // DB의 요일 텍스트를 숫자로 변환
    const targetDay = dayOrderMap[currentTime.day_of_week]; 
    
    const dates = [];
    // 28일 동안 루프를 돌며 해당 요일만 추출
    for (let i = 0; i < 28; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        if (d.getDay() === targetDay) {
            dates.push(new Date(d));
        }
    }

    dates.forEach(date => {
        // 현지 시간 기준으로 YYYY-MM-DD 생성
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const isReserved = reservedDates.includes(dateStr);
        
        const btn = document.createElement('div');
        btn.className = `date-item ${isReserved ? 'reserved' : ''}`;
        btn.innerHTML = `
            <div class="date-month">${date.getMonth() + 1}월</div>
            <div class="date-num">${date.getDate()}</div>
            <div class="date-day">${currentTime.day_of_week}요일</div>
            <div class="date-status">${isReserved ? '예약불가' : '예약가능'}</div>
        `;
        
        if (!isReserved) {
            btn.onclick = () => {
                selectedDate = dateStr;
                const modalDate = document.getElementById('modalDate');
                if (modalDate) modalDate.innerText = formatDateDisplay(dateStr);
                showModal('confirmModal');
            };
        }
        grid.appendChild(btn);
    });
}

/**
 * 예약 확정 (Supabase 전송)
 */
async function confirmReservation() {
    const reservation = {
        id: generateUUID(),
        participant_name: sessionStorage.getItem('participantName'),
        participant_birthdate: sessionStorage.getItem('participantBirthdate'),
        participant_gender: sessionStorage.getItem('participantGender'),
        participant_phone: sessionStorage.getItem('participantPhone'),
        participant_address: sessionStorage.getItem('participantAddress'),
        participant_occupation: sessionStorage.getItem('participantOccupation'),
        participant_relationship: sessionStorage.getItem('participantRelationship'),
        operator_id: sessionStorage.getItem('selectedOperatorId'),
        time_id: sessionStorage.getItem('selectedTimeId'),
        reservation_date: selectedDate,
        consent_agreed: true
    };
    
    try {
        await createData('reservations', reservation);
        sessionStorage.setItem('reservationDate', selectedDate);
        sessionStorage.setItem('reservationId', reservation.id);
        window.location.href = 'success.html';
    } catch (e) {
        alert('예약 저장에 실패했습니다.');
    }
}

document.addEventListener('DOMContentLoaded', loadReservationData);
