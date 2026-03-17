// 예약 날짜 선택 페이지 로직 전문

let currentTime = null;
let currentOperator = null;
let reservedDates = [];
let selectedDate = null;

const dayOrder = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5 };

/**
 * 데이터 로드 (타임, 술자, 기존 예약 현황)
 */
async function loadReservationData() {
    const timeId = sessionStorage.getItem('selectedTimeId');
    const operatorId = sessionStorage.getItem('selectedOperatorId');
    
    if (!timeId || !operatorId) {
        alert('잘못된 접근입니다.');
        window.location.href = 'selection.html';
        return;
    }
    
    showLoading('dateGrid');
    
    try {
        // 1. 타임 및 술자 정보 로드
        currentTime = await getRecord('times', timeId);
        currentOperator = await getRecord('operators', operatorId);
        
        // 2. 해당 술자의 예약 정보 로드 (Supabase 날짜 형식 대응)
        try {
            const res = await getData('reservations');
            const allReservations = res || [];
            reservedDates = allReservations
                .filter(r => r.operator_id === operatorId)
                .map(r => r.reservation_date); // 'YYYY-MM-DD' 리스트 생성
        } catch (err) {
            reservedDates = [];
        }
        
        displayReservationInfo();
        displayAvailableDates();
    } catch (error) {
        console.error('데이터 로드 오류:', error);
        showError('dateGrid', '데이터를 불러오는 중 오류가 발생했습니다.');
    }
}

/**
 * 상단 정보 표시
 */
function displayReservationInfo() {
    const infoContainer = document.getElementById('operatorInfo');
    if (infoContainer && currentTime && currentOperator) {
        infoContainer.innerHTML = `
            <div class="selected-info-card">
                <p><strong>담당 술자:</strong> ${currentOperator.name}</p>
                <p><strong>실습 타임:</strong> ${currentTime.name} (${currentTime.day_of_week}요일 / ${currentTime.time_range})</p>
            </div>
        `;
    }
}

/**
 * 예약 가능한 날짜 그리드 생성 (원본 로직 완벽 복구)
 */
function displayAvailableDates() {
    const grid = document.getElementById('dateGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDayNum = dayOrder[currentTime.day_of_week]; // 월=1, 화=2...
    const dates = [];
    
    // 향후 4주(28일)간 해당 요일의 날짜 계산
    for (let i = 0; i < 28; i++) {
        const tempDate = new Date(today);
        tempDate.setDate(today.getDate() + i);
        
        // Date.getDay(): 일=0, 월=1, 화=2... (targetDayNum과 매칭)
        if (tempDate.getDay() === (targetDayNum % 7)) {
            dates.push(new Date(tempDate));
        }
    }

    dates.forEach(date => {
        // YYYY-MM-DD 형식 문자열 생성
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const isReserved = reservedDates.includes(dateStr);
        
        const dateItem = document.createElement('div');
        dateItem.className = `date-item ${isReserved ? 'reserved' : ''}`;
        
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        const dayName = dayNames[date.getDay()];
        
        dateItem.innerHTML = `
            <div class="date-month">${date.getMonth() + 1}월</div>
            <div class="date-num">${date.getDate()}</div>
            <div class="date-day">${dayName}요일</div>
            <div class="date-status">${isReserved ? '예약불가' : '예약가능'}</div>
        `;
        
        if (!isReserved) {
            dateItem.onclick = () => openConfirmModal(dateStr);
        }
        grid.appendChild(dateItem);
    });
}

/**
 * 예약 확인 모달 (기존 기능 100% 복구)
 */
function openConfirmModal(date) {
    selectedDate = date;
    const modalDate = document.getElementById('modalDate');
    if (modalDate) {
        modalDate.innerText = formatDateDisplay(date);
    }
    showModal('confirmModal');
}

/**
 * 최종 예약 생성 (Supabase 전송)
 */
async function confirmReservation() {
    const participantName = sessionStorage.getItem('participantName');
    const participantBirthdate = sessionStorage.getItem('participantBirthdate');
    const participantGender = sessionStorage.getItem('participantGender');
    const participantPhone = sessionStorage.getItem('participantPhone');
    const participantAddress = sessionStorage.getItem('participantAddress');
    const participantOccupation = sessionStorage.getItem('participantOccupation');
    const participantRelationship = sessionStorage.getItem('participantRelationship');
    
    const timeId = sessionStorage.getItem('selectedTimeId');
    const operatorId = sessionStorage.getItem('selectedOperatorId');
    
    try {
        const reservation = {
            id: generateUUID(),
            participant_name: participantName,
            participant_birthdate: participantBirthdate,
            participant_gender: participantGender,
            participant_phone: participantPhone,
            participant_address: participantAddress,
            participant_occupation: participantOccupation,
            participant_relationship: participantRelationship,
            operator_id: operatorId,
            time_id: timeId,
            reservation_date: selectedDate,
            consent_agreed: true
        };
        
        await createData('reservations', reservation);
        
        sessionStorage.setItem('reservationDate', selectedDate);
        sessionStorage.setItem('reservationId', reservation.id);
        
        window.location.href = 'success.html';
    } catch (error) {
        alert('예약 저장 중 오류가 발생했습니다.');
    }
}

document.addEventListener('DOMContentLoaded', loadReservationData);
