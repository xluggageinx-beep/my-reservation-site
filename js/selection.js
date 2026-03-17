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
        // [수정] 등록 순서(먼저 등록된 학생이 앞)를 보장하기 위해 id나 생성일 순으로 정렬
        operators = (operatorsResponse || []).sort((a, b) => a.id.localeCompare(b.id));
        
        try {
            const reservationsResponse = await getData('reservations');
            reservations = reservationsResponse || [];
        } catch (resErr) {
            reservations = [];
        }
        
        if (times.length === 0) {
            showError('timesContainer', '현재 등록된 실습 타임이 없습니다.');
            return;
        }
        
        displayTimesAndOperators();
    } catch (error) {
        showError('timesContainer', '데이터를 불러오는 중 오류가 발생했습니다.');
    }
}

function displayTimesAndOperators() {
    const container = document.getElementById('timesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // 요일/시간 순으로 타임 정렬
    const sortedTimes = [...times].sort((a, b) => {
        const orderA = dayOrder[a.day_of_week] || 99;
        const orderB = dayOrder[b.day_of_week] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return (a.time_range || '').localeCompare(b.time_range || '');
    });
    
    sortedTimes.forEach(time => {
        const timeOperators = operators.filter(op => String(op.time_id) === String(time.id));
        
        if (timeOperators.length > 0) {
            const timeCard = document.createElement('div');
            timeCard.className = 'time-card';
            // 원래의 예쁜 스타일 구조로 복원
            timeCard.innerHTML = `
                <div class="time-card-header" style="background-color: #f8faff; padding: 15px; border-bottom: 1px solid #edf2f7;">
                    <h3 style="margin:0; color: #2d3748; font-size: 1.2em;">${time.name}</h3>
                    <div style="font-size: 0.9em; color: #4a5568; margin-top: 5px;">
                        <strong>${time.day_of_week}요일</strong> | ${time.time_range}
                    </div>
                </div>
                <div class="operator-list" id="operators-${time.id}" style="padding: 10px;">
                </div>
            `;
            container.appendChild(timeCard);
            
            const operatorList = document.getElementById(`operators-${time.id}`);
            timeOperators.forEach(operator => {
                const operatorItem = document.createElement('div');
                operatorItem.className = 'operator-item';
                // 원래 사진처럼 깔끔한 리스트 형태
                operatorItem.innerHTML = `
                    <div class="operator-info" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <span style="font-weight: 600; color: #3182ce;">${operator.name} 학생</span>
                        <span style="font-size: 0.85em; color: #a0aec0;">선택하기 ></span>
                    </div>
                `;
                operatorItem.onclick = () => selectOperator(time.id, operator.id, time.name, operator.name);
                operatorList.appendChild(operatorItem);
            });
        }
    });
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
