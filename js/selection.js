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
        // 타임 데이터 로드
        console.log('1. 타임 데이터 로드 중...');
        const timesResponse = await getData('times', { limit: 100 });
        console.log('타임 응답:', timesResponse);
        times = (timesResponse && timesResponse.data) ? timesResponse.data : [];
        console.log('타임 개수:', times.length);
        
        // 술자 데이터 로드
        console.log('2. 술자 데이터 로드 중...');
        const operatorsResponse = await getData('operators', { limit: 1000 });
        console.log('술자 응답:', operatorsResponse);
        operators = (operatorsResponse && operatorsResponse.data) ? operatorsResponse.data : [];
        console.log('술자 개수:', operators.length);
        
        // 예약 데이터 로드 (실패해도 계속 진행)
        console.log('3. 예약 데이터 로드 중...');
        try {
            const reservationsResponse = await getData('reservations', { limit: 100 });
            console.log('예약 응답:', reservationsResponse);
            reservations = (reservationsResponse && reservationsResponse.data) ? reservationsResponse.data : [];
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
        // 1. 요일 순서로 정렬 (월, 화, 수, 목, 금)
        const dayA = dayOrder[a.day_of_week] || 99;
        const dayB = dayOrder[b.day_of_week] || 99;
        const dayCompare = dayA - dayB;
        if (dayCompare !== 0) return dayCompare;
        
        // 2. 같은 요일이면 시간 순서로 정렬 (이른 시간이 앞)
        const timeA = extractStartTime(a.time_range);
        const timeB = extractStartTime(b.time_range);
        return timeA.localeCompare(timeB);
    });
}

// 타임과 술자 표시
function displayTimesAndOperators() {
    const container = document.getElementById('timesContainer');
    if (!container) {
        console.error('timesContainer 요소를 찾을 수 없습니다.');
        return;
    }
    
    container.innerHTML = '';
    
    // 타임 정렬: 월, 화, 수, 목, 금 순서 → 같은 요일 내에서 이른 시간 순
    const sortedTimes = sortTimes([...times]);
    
    console.log('정렬된 타임:', sortedTimes);
    
    // 표시할 타임이 있는지 확인
    let hasVisibleTime = false;
    
    // 각 타임별로 카드 생성
    sortedTimes.forEach(time => {
        // 해당 타임의 술자들 가져오기
        let timeOperators = operators.filter(op => op.time_id === time.id);
        
        // 술자가 없으면 타임 표시 안 함
        if (timeOperators.length === 0) {
            console.log(`타임 ${time.name}에 술자가 없습니다.`);
            return;
        }
        
        hasVisibleTime = true;
        
        // 술자 정렬: created_at 순서 (먼저 추가된 술자가 앞)
        timeOperators = timeOperators.sort((a, b) => {
            if (a.created_at && b.created_at) {
                return a.created_at - b.created_at;
            }
            return 0;
        });
        
        console.log(`타임 ${time.name} 술자:`, timeOperators.length, '명');
        
        // 타임 카드 생성
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
        
        // 술자 리스트 표시
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
    
    // 표시할 타임이 없으면 메시지 표시
    if (!hasVisibleTime) {
        container.innerHTML = '<div class="notice-box" style="text-align: center; padding: 40px;"><p>현재 선택 가능한 술자가 없습니다.<br>관리자에게 문의해주세요.</p></div>';
    }
}

// 술자 선택
function selectOperator(timeId, operatorId, timeName, operatorName) {
    console.log('술자 선택:', { timeId, operatorId, timeName, operatorName });
    
    // 이미 예약한 술자가 있는지 확인
    const participantPhone = sessionStorage.getItem('participantPhone');
    if (participantPhone && reservations.length > 0) {
        const existingReservation = reservations.find(r => r.participant_phone === participantPhone);
        if (existingReservation && existingReservation.operator_id !== operatorId) {
            alert('이미 다른 실습생에게 예약하셨습니다. 한 실습생에게만 예약 가능합니다.');
            return;
        }
    }
    
    // 선택 정보 저장
    sessionStorage.setItem('selectedTimeId', timeId);
    sessionStorage.setItem('selectedOperatorId', operatorId);
    sessionStorage.setItem('selectedTimeName', timeName);
    sessionStorage.setItem('selectedOperatorName', operatorName);
    
    // 예약 페이지로 이동
    window.location.href = 'reservation.html';
}

// 페이지 로드 시
document.addEventListener('DOMContentLoaded', function() {
    console.log('술자 선택 페이지 로드');
    
    // 참가자 정보 확인
    const participantName = sessionStorage.getItem('participantName');
    const participantPhone = sessionStorage.getItem('participantPhone');
    
    console.log('참가자 정보:', { participantName, participantPhone });
    
    if (!participantName || !participantPhone) {
        alert('참가자 정보를 먼저 입력해주세요.');
        window.location.href = 'participant.html';
        return;
    }
    
    // 데이터 로드
    loadTimesAndOperators();
});
