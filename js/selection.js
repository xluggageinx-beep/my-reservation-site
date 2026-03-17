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
        const timesResponse = await getData('times');
        times = timesResponse || [];
        
        const operatorsResponse = await getData('operators');
        operators = operatorsResponse || [];
        
        try {
            const reservationsResponse = await getData('reservations');
            reservations = reservationsResponse || [];
        } catch (resErr) {
            reservations = [];
        }
        
        if (times.length === 0 || operators.length === 0) {
            showError('timesContainer', '현재 선택 가능한 술자가 없습니다.');
            return;
        }
        
        displayTimesAndOperators();
    } catch (error) {
        showError('timesContainer', '데이터를 불러오는 중 오류가 발생했습니다.');
    }
}

function sortTimes(timesArray) {
    return timesArray.sort((a, b) => {
        const dayA = dayOrder[a.day_of_week] || 99;
        const dayB = dayOrder[b.day_of_week] || 99;
        if (dayA !== dayB) return dayA - dayB;
        return (a.time_range || '').localeCompare(b.time_range || '');
    });
}

function displayTimesAndOperators() {
    const container = document.getElementById('timesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    const sortedTimes = sortTimes([...times]);
    let hasVisibleTime = false;
    
    sortedTimes.forEach(time => {
        let timeOperators = operators.filter(op => String(op.time_id) === String(time.id));
        if (timeOperators.length === 0) return;
        
        hasVisibleTime = true;
        const timeCard = document.createElement('div');
        timeCard.className = 'time-card';
        timeCard.innerHTML = `
            <h3>${time.name}</h3>
            <div class="time-info">
                <p><strong>요일:</strong> ${time.day_of_week}요일</p>
                <p><strong>시간:</strong> ${time.time_range}</p>
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
        container.innerHTML = '<p>현재 가능한 예약 타임이 없습니다.</p>';
    }
}

function selectOperator(timeId, operatorId, timeName, operatorName) {
    const participantPhone = sessionStorage.getItem('participantPhone');
    if (participantPhone && reservations.length > 0) {
        const existing = reservations.find(r => r.participant_phone === participantPhone);
        if (existing && existing.operator_id !== operatorId) {
            alert('이미 다른 실습생에게 예약하셨습니다.');
            return;
        }
    }
    
    sessionStorage.setItem('selectedTimeId', timeId);
    sessionStorage.setItem('selectedOperatorId', operatorId);
    sessionStorage.setItem('selectedTimeName', timeName);
    sessionStorage.setItem('selectedOperatorName', operatorName);
    window.location.href = 'reservation.html';
}

document.addEventListener('DOMContentLoaded', loadTimesAndOperators);
