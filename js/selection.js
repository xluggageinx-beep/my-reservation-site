// 술자 선택 페이지 로직

let times = [];
let operators = [];
let reservations = [];

// 요일 순서 맵
const dayOrder = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5 };

// 타임과 술자 리스트 로드
async function loadTimesAndOperators() {
    const container = document.getElementById('timesContainer');
    if (!container) {
        console.error('timesContainer 요소를 찾을 수 없습니다.');
        return;
    }
    
    showLoading('timesContainer');
    
    try {
        // 1. 타임 데이터 로드
        console.log('1. 타임 데이터 로드 중...');
        const timesResponse = await getData('times', { limit: 100 });
        console.log('타임 응답:', timesResponse);
        // [수정됨] Supabase는 데이터를 바로 주므로 .data를 삭제합니다.
        times = timesResponse || []; 
        console.log('타임 개수:', times.length);
        
        // 2. 술자 데이터 로드
        console.log('2. 술자 데이터 로드 중...');
        const operatorsResponse = await getData('operators', { limit: 1000 });
        console.log('술자 응답:', operatorsResponse);
        // [수정됨] Supabase는 데이터를 바로 주므로 .data를 삭제합니다.
        operators = operatorsResponse || []; 
        console.log('술자 개수:', operators.length);
        
        // 3. 예약 데이터 로드
        console.log('3. 예약 데이터 로드 중...');
        try {
            const reservationsResponse = await getData('reservations', { limit: 100 });
            console.log('예약 응답:', reservationsResponse);
            // [수정됨] Supabase는 데이터를 바로 주므로 .data를 삭제합니다.
            reservations = reservationsResponse || []; 
            console.log('예약 개수:', reservations.length);
        } catch (reservationError) {
            console.warn('예약 데이터 로드 실패 (계속 진행):', reservationError);
            reservations = [];
        }
        
        console.log('로드된 데이터:', { times: times.length, operators: operators.length, reservations: reservations.length });
        
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

// 시간 범위에서 시작 시간 추출 (정렬용)
function extractStartTime(timeRange) {
    if (!timeRange) return '00:00';
    const match = timeRange.match(/^(\d{2}:\d{2})/);
    return match ? match[1] : '00:00';
}

// 타임 정렬 함수
function sortTimes(timesArray) {
    return timesArray.sort((a, b) => {
        const dayA = dayOrder[a.day_of_week] || 99;
        const dayB = dayOrder[b.day_of_week] || 99;
        const dayCompare = dayA - dayB;
        if (dayCompare !== 0) return dayCompare;
        
        const timeA = extractStartTime(a.time_range);
        const timeB = extractStartTime(b.time_range);
        return timeA.localeCompare(timeB);
    });
}

// 타임과 술자 표시
function displayTimesAndOperators() {
    const container = document.getElementById('timesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    const sortedTimes = sortTimes([...times]);
    let hasVisibleTime = false;
    
    sortedTimes.forEach(time => {
        // 중요: id 타입이 문자열이든 숫자든 상관없이 비교되도록 == 사용
        let timeOperators = operators.filter(op => op.time_id == time.id);
        
        if (timeOperators.length === 0) return;
        
        hasVisibleTime = true;
        
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
        if (operatorList) {
            timeOperators.forEach(operator => {
                const operatorItem = document.createElement('div');
                operatorItem.className = 'operator-item';
                operatorItem.innerHTML = `<h4>${operator.name}</h4>`;
                operatorItem.onclick = () => selectOperator(time.id, operator.id, time.name, operator.name);
                operatorList.appendChild(operatorItem);
            });
        }
    });
    
    if (!hasVisibleTime) {
        container.innerHTML = '<div class="notice-box" style="text-align: center; padding: 40px;"><p>현재 선택 가능한 술자가 없습니다.<br>관리자에게 문의해주세요.</p></div>';
    }
}

// 술자 선택 및 저장
function selectOperator(timeId, operatorId, timeName, operatorName) {
    sessionStorage.setItem('selectedTimeId', timeId);
    sessionStorage.setItem('selectedOperatorId', operatorId);
    sessionStorage.setItem('selectedTimeName', timeName);
    sessionStorage.setItem('selectedOperatorName', operatorName);
    window.location.href = 'reservation.html';
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
    loadTimesAndOperators();
});
