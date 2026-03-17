// 예약 날짜 선택 페이지 로직

let currentTime = null;
let currentOperator = null;
let reservedDates = [];
let selectedDate = null;

// 데이터 로드
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
        // 타임 정보 로드
        currentTime = await getRecord('times', timeId);
        
        // 술자 정보 로드
        currentOperator = await getRecord('operators', operatorId);
        
        // 해당 술자의 예약 정보 로드 (실패해도 계속 진행)
        try {
            const reservationsResponse = await getData('reservations', { limit: 100 });
            const allReservations = (reservationsResponse && reservationsResponse.data) ? reservationsResponse.data : [];
            reservedDates = allReservations
                .filter(r => r.operator_id === operatorId)
                .map(r => r.reservation_date);
        } catch (reservationError) {
            console.warn('예약 데이터 로드 실패 (빈 목록으로 진행):', reservationError);
            reservedDates = [];
        }
        
        displayReservationInfo();
        displayAvailableDates();
    } catch (error) {
        console.error('데이터 로드 오류:', error);
        showError('dateGrid', '데이터를 불러오는 중 오류가 발생했습니다.');
    }
}

// 예약 정보 표시
function displayReservationInfo() {
    document.getElementById('operatorTitle').textContent = `${currentOperator.name} 학생`;
    
    const timeInfo = document.getElementById('timeInfo');
    timeInfo.innerHTML = `
        <h3 style="color: var(--primary-color); margin-bottom: 15px;">${currentTime.name}</h3>
        <p><strong>요일:</strong> ${currentTime.day_of_week}요일</p>
        <p><strong>시간:</strong> ${currentTime.time_range}</p>
    `;
}

// 예약 가능한 날짜 표시
function displayAvailableDates() {
    const dateGrid = document.getElementById('dateGrid');
    dateGrid.innerHTML = '';
    
    if (!currentTime.selected_dates || currentTime.selected_dates.length === 0) {
        showError('dateGrid', '등록된 주차 정보가 없습니다.');
        return;
    }
    
    currentTime.selected_dates.forEach(date => {
        const dateButton = document.createElement('button');
        dateButton.className = 'date-button';
        dateButton.textContent = formatDateShort(date);
        
        const isPast = isPastDate(date);
        const isReserved = reservedDates.includes(date);
        
        if (isPast || isReserved) {
            dateButton.disabled = true;
            if (isReserved) {
                dateButton.classList.add('reserved');
                dateButton.title = '이미 예약됨';
            } else {
                dateButton.title = '지난 날짜';
            }
        } else {
            dateButton.onclick = () => selectDate(date);
        }
        
        dateGrid.appendChild(dateButton);
    });
}

// 날짜 선택
function selectDate(date) {
    selectedDate = date;
    
    // 선택 표시
    document.querySelectorAll('.date-button').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    // 확인 모달 표시
    showConfirmationModal();
}

// 확인 모달 표시
function showConfirmationModal() {
    const confirmContent = document.getElementById('confirmContent');
    const timeName = sessionStorage.getItem('selectedTimeName');
    const operatorName = sessionStorage.getItem('selectedOperatorName');
    
    confirmContent.innerHTML = `
        <p><strong>${formatDateDisplay(selectedDate)}</strong></p>
        <p><strong>${timeName}</strong></p>
        <p><strong>${operatorName}</strong> 학생에게</p>
        <p>예약하시겠습니까?</p>
    `;
    
    showModal('confirmModal');
}

// 확인 모달 닫기
function closeConfirmModal() {
    hideModal('confirmModal');
    selectedDate = null;
    
    // 선택 해제
    document.querySelectorAll('.date-button').forEach(btn => {
        btn.classList.remove('selected');
    });
}

async function confirmReservation() {
    if (!selectedDate) {
        alert('날짜를 선택해주세요.');
        return;
    }
    
    const participantName = sessionStorage.getItem('participantName');
    const participantBirthdate = sessionStorage.getItem('participantBirthdate');
    const participantGender = sessionStorage.getItem('participantGender');
    const participantPhone = sessionStorage.getItem('participantPhone');
    const participantAddress = sessionStorage.getItem('participantAddress');
    const participantOccupation = sessionStorage.getItem('participantOccupation');
    const participantRelationship = sessionStorage.getItem('participantRelationship') || '미입력';
    const timeId = sessionStorage.getItem('selectedTimeId');
    const operatorId = sessionStorage.getItem('selectedOperatorId');
    
    try {
        // 예약 생성
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
        
        // 예약 정보 세션에 저장
        sessionStorage.setItem('reservationDate', selectedDate);
        sessionStorage.setItem('reservationId', reservation.id);
        
        // 성공 페이지로 이동
        navigateToSuccess();
    } catch (error) {
        console.error('예약 생성 오류:', error);
        alert('예약 중 오류가 발생했습니다. 다시 시도해주세요.');
        hideModal('confirmModal');
    }
}

// 페이지 로드 시
document.addEventListener('DOMContentLoaded', function() {
    const participantName = sessionStorage.getItem('participantName');
    const participantPhone = sessionStorage.getItem('participantPhone');
    
    if (!participantName || !participantPhone) {
        alert('참가자 정보를 먼저 입력해주세요.');
        window.location.href = 'participant.html';
        return;
    }
    
    loadReservationData();
});
