// 예약 날짜 선택 페이지 로직

let currentTime = null;
let currentOperator = null;
let reservedDates = [];
let selectedDate = null;

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
        currentTime = await getRecord('times', timeId);
        currentOperator = await getRecord('operators', operatorId);

        if (!currentTime || !currentOperator) {
            showError('dateGrid', '타임 또는 술자 정보를 찾을 수 없습니다.');
            return;
        }

        try {
            const allReservations = await getData('reservations', {
                operator_id: operatorId,
                limit: 1000
            });

            reservedDates = allReservations.map(r => r.reservation_date);
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

function displayReservationInfo() {
    const title = document.getElementById('operatorTitle');
    const timeInfo = document.getElementById('timeInfo');

    if (title) {
        title.textContent = `${currentOperator.name} 학생`;
    }

    if (timeInfo) {
        timeInfo.innerHTML = `
            <h3 style="color: var(--primary-color); margin-bottom: 15px;">${currentTime.name}</h3>
            <p><strong>요일:</strong> ${currentTime.day_of_week}요일</p>
            <p><strong>시간:</strong> ${currentTime.time_range}</p>
        `;
    }
}

function displayAvailableDates() {
    const dateGrid = document.getElementById('dateGrid');
    if (!dateGrid) return;

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
            dateButton.onclick = () => selectDate(date, dateButton);
        }

        dateGrid.appendChild(dateButton);
    });
}

function selectDate(date, buttonElement) {
    selectedDate = date;

    document.querySelectorAll('.date-button').forEach(btn => {
        btn.classList.remove('selected');
    });

    if (buttonElement) {
        buttonElement.classList.add('selected');
    }

    showConfirmationModal();
}

function showConfirmationModal() {
    const confirmContent = document.getElementById('confirmContent');
    const timeName = sessionStorage.getItem('selectedTimeName');
    const operatorName = sessionStorage.getItem('selectedOperatorName');

    if (confirmContent) {
        confirmContent.innerHTML = `
            <p><strong>${formatDateDisplay(selectedDate)}</strong></p>
            <p><strong>${timeName}</strong></p>
            <p><strong>${operatorName}</strong> 학생에게</p>
            <p>예약하시겠습니까?</p>
        `;
    }

    showModal('confirmModal');
}

function closeConfirmModal() {
    hideModal('confirmModal');
    selectedDate = null;

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

    if (!participantName || !participantPhone || !timeId || !operatorId) {
        alert('예약 정보가 누락되었습니다. 처음부터 다시 진행해주세요.');
        return;
    }

    try {
        // 1) 동일 술자/동일 날짜 중복 방지
        const sameSlotReservations = await getData('reservations', {
            operator_id: operatorId,
            reservation_date: selectedDate,
            limit: 10
        });

        if (sameSlotReservations.length > 0) {
            alert('해당 날짜는 이미 예약되었습니다. 다른 날짜를 선택해주세요.');
            closeConfirmModal();
            await loadReservationData();
            return;
        }

        // 2) 한 대상자는 다른 술자 중복 예약 불가
        const myReservations = await getData('reservations', {
            participant_phone: participantPhone,
            limit: 100
        });

        const otherOperatorReservation = myReservations.find(r => r.operator_id !== operatorId);
        if (otherOperatorReservation) {
            alert('이미 다른 실습생에게 예약하셨습니다. 한 실습생에게만 예약 가능합니다.');
            closeConfirmModal();
            return;
        }

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

        navigateToSuccess();
    } catch (error) {
        console.error('예약 생성 오류:', error);
        alert('예약 중 오류가 발생했습니다. 다시 시도해주세요.');
        hideModal('confirmModal');
    }
}

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
