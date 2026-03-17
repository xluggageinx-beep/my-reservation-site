// 술자 선택 페이지 로직

let times = [];
let operators = [];
let reservations = [];

// 요일 순서 맵 (기존 로직 유지)
const dayOrder = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5 };

/**
 * 타임과 술자 리스트 로드
 */
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
        const timesResponse = await getData('times');
        // Supabase 응답에 맞게 .data 제거 로직 적용
        times = timesResponse || [];
        console.log('타임 개수:', times.length);
        
        // 2. 술자 데이터 로드
        console.log('2. 술자 데이터 로드 중...');
        const operatorsResponse = await getData('operators');
        operators = operatorsResponse || [];
        console.log('술자 개수:', operators.length);
        
        // 3. 예약 데이터 로드 (중복 예약 방지 로직용)
        console.log('3. 예약 데이터 로드 중...');
        try {
            const reservationsResponse = await getData('reservations');
            reservations = reservationsResponse || [];
        } catch (resError) {
            console.warn('예약 데이터 로드 실패 (무시하고 진행):', resError);
            reservations = [];
        }
        
        if (times.length === 0) {
            showError('timesContainer', '현재 등록된 실습 타임이 없습니다.');
            return;
        }
        
        displayTimesAndOperators();
    } catch (error) {
        console.error('데이터 로드 오류:', error);
        showError('timesContainer', '데이터를 불러오는 중 오류가 발생했습니다. 관리자에게 문의하세요.');
    }
}

/**
 * 화면에 타임별 술자 리스트 표시
 */
function displayTimesAndOperators() {
    const container = document.getElementById('timesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // 요일/시간 순으로 정렬
    const sortedTimes = [...times].sort((a, b) => {
        const orderA = dayOrder[a.day_of_week] || 99;
        const orderB = dayOrder[b.day_of_week] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return (a.time_range || '').localeCompare(b.time_range || '');
    });
    
    let hasVisibleTime = false;
    
    sortedTimes.forEach(time => {
        // 해당 타임에 속한 술자들 필터링
        const timeOperators = operators.filter(op => String(op.time_id) === String(time.id));
        
        // 술자가 있는 타임만 표시
        if (timeOperators.length > 0) {
            hasVisibleTime = true;
            
            const timeCard = document.createElement('div');
            timeCard.className = 'time-card';
            timeCard.innerHTML = `
                <div class="time-card-header">
                    <h3>${time.name}</h3>
                    <span class="time-badge">${time.day_of_week}요일 / ${time.time_range}</span>
                </div>
                <div class="operator-list" id="operators-${time.id}">
                    </div>
            `;
            container.appendChild(timeCard);
            
            const operatorList = document.getElementById(`operators-${time.id}`);
            timeOperators.forEach(operator => {
                const operatorItem = document.createElement('div');
                operatorItem.className = 'operator-item';
                operatorItem.innerHTML = `
                    <div class="operator-info">
                        <span class="operator-name">${operator.name} 학생</span>
                        <span class="operator-desc">클릭하여 예약 가능 여부 확인</span>
                    </div>
                `;
                operatorItem.onclick = () => selectOperator(time.id, operator.id, time.name, operator.name);
                operatorList.appendChild(operatorItem);
            });
        }
    });
    
    if (!hasVisibleTime) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <p>현재 예약 가능한 술자가 없습니다.</p>
            </div>
        `;
    }
}

/**
 * 술자 선택 시 예약 페이지로 이동
 */
function selectOperator(timeId, operatorId, timeName, operatorName) {
    console.log('술자 선택 시도:', { timeId, operatorId, timeName, operatorName });
    
    // 중복 예약 체크 로직 (기존 기능 보존)
    const participantPhone = sessionStorage.getItem('participantPhone');
    if (participantPhone && reservations.length > 0) {
        const existingReservation = reservations.find(r => r.participant_phone === participantPhone);
        if (existingReservation && existingReservation.operator_id !== operatorId) {
            alert('이미 다른 실습생에게 예약하셨습니다. 한 실습생에게만 예약 가능합니다.');
            return;
        }
    }
    
    // 세션 저장
    sessionStorage.setItem('selectedTimeId', timeId);
    sessionStorage.setItem('selectedOperatorId', operatorId);
    sessionStorage.setItem('selectedTimeName', timeName);
    sessionStorage.setItem('selectedOperatorName', operatorName);
    
    // 예약 날짜 선택 페이지로 이동
    window.location.href = 'reservation.html';
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('술자 선택 페이지 초기화 중...');
    
    const participantName = sessionStorage.getItem('participantName');
    const participantPhone = sessionStorage.getItem('participantPhone');
    
    if (!participantName || !participantPhone) {
        alert('참가자 정보를 먼저 입력해주세요.');
        window.location.href = 'participant.html';
        return;
    }
    
    loadTimesAndOperators();
});
