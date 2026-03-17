// 술자 선택 페이지 로직

let times = [];
let operators = [];
let reservations = [];

const dayOrder = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5 };

async function loadTimesAndOperators() {
    const container = document.getElementById('timesContainer');
    if (!container) return;

    showLoading('timesContainer');

    try {
        times = await getData('times', {
            order: 'day_of_week.asc,name.asc',
            limit: 100
        });

        operators = await getData('operators', {
            order: 'created_at.asc,name.asc',
            limit: 1000
        });

        try {
            reservations = await getData('reservations', {
                limit: 1000
            });
        } catch (reservationError) {
            console.warn('예약 데이터 로드 실패:', reservationError);
            reservations = [];
        }

        if (times.length === 0) {
            showError('timesContainer', '등록된 타임이 없습니다. 관리자에게 문의해주세요.');
            return;
        }

        if (operators.length === 0) {
            showError('timesContainer', '등록된 술자가 없습니다. 관리자에게 문의해주세요.');
            return;
        }

        displayTimesAndOperators();
    } catch (error) {
        console.error('데이터 로드 오류:', error);
        showError('timesContainer', '데이터를 불러오는 중 오류가 발생했습니다. 페이지를 새로고침 해주세요.');
    }
}

function extractStartTime(timeRange) {
    if (!timeRange) return '00:00';
    const match = String(timeRange).match(/^(\d{1,2}:\d{2})/);
    return match ? match[1].padStart(5, '0') : '00:00';
}

function sortTimes(timesArray) {
    return timesArray.sort((a, b) => {
        const dayA = dayOrder[a.day_of_week] || 99;
        const dayB = dayOrder[b.day_of_week] || 99;

        if (dayA !== dayB) return dayA - dayB;

        const timeA = extractStartTime(a.time_range);
        const timeB = extractStartTime(b.time_range);

        return timeA.localeCompare(timeB);
    });
}

function displayTimesAndOperators() {
    const container = document.getElementById('timesContainer');
    if (!container) return;

    container.innerHTML = '';

    const sortedTimes = sortTimes([...times]);
    let hasVisibleTime = false;

    sortedTimes.forEach(time => {
        let timeOperators = operators.filter(op => op.time_id === time.id);

        if (timeOperators.length === 0) return;

        hasVisibleTime = true;

        timeOperators = timeOperators.sort((a, b) => {
            const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
            const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
            return aCreated - bCreated;
        });

        const timeCard = document.createElement('div');
        timeCard.className = 'time-card';

        timeCard.innerHTML = `
            <h3>${time.name}</h3>
            <div class="time-info">
                <p><strong>요일:</strong> ${time.day_of_week}요일</p>
                <p><strong>시간:</strong> ${time.time_range}</p>
                <p><strong>술자 수:</strong> ${timeOperators.length}명</p>
            </div>
            <div class="operator-list" id="operators-${time.id}"></div>
        `;

        container.appendChild(timeCard);

        const operatorList = document.getElementById(`operators-${time.id}`);
        timeOperators.forEach(operator => {
            const operatorItem = document.createElement('div');
            operatorItem.className = 'operator-item';
            operatorItem.innerHTML = `<h4>${operator.name}</h4>`;
            operatorItem.onclick = () => selectOperator(time.id, operator.id, time.name, operator.name);
            operatorList.appendChild(operatorItem);
        });
    });

    if (!hasVisibleTime) {
        container.innerHTML = `
            <div class="notice-box" style="text-align: center; padding: 40px;">
                <p>현재 선택 가능한 술자가 없습니다.<br>관리자에게 문의해주세요.</p>
            </div>
        `;
    }
}

function selectOperator(timeId, operatorId, timeName, operatorName) {
    const participantPhone = sessionStorage.getItem('participantPhone');

    if (participantPhone && reservations.length > 0) {
        const existingReservation = reservations.find(r => r.participant_phone === participantPhone);
        if (existingReservation && existingReservation.operator_id !== operatorId) {
            alert('이미 다른 실습생에게 예약하셨습니다. 한 실습생에게만 예약 가능합니다.');
            return;
        }
    }

    sessionStorage.setItem('selectedTimeId', timeId);
    sessionStorage.setItem('selectedOperatorId', operatorId);
    sessionStorage.setItem('selectedTimeName', timeName);
    sessionStorage.setItem('selectedOperatorName', operatorName);

    window.location.href = 'reservation.html';
}

document.addEventListener('DOMContentLoaded', function() {
    const participantName = sessionStorage.getItem('participantName');
    const participantPhone = sessionStorage.getItem('participantPhone');

    if (!participantName || !participantPhone) {
        alert('참가자 정보를 먼저 입력해주세요.');
        window.location.href = 'participant.html';
        return;
    }

    loadTimesAndOperators();
});
