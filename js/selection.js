// 술자 선택 페이지 로직 전문

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
    if (!container) return;
    
    showLoading('timesContainer');
    
    try {
        // 1. 타임 데이터 로드
        const timesResponse = await getData('times');
        times = timesResponse || [];
        
        // 2. 술자 데이터 로드 (등록 순서 보장을 위해 정렬 로직 강화)
        const operatorsResponse = await getData('operators');
        // Supabase에서 가져온 데이터를 '생성일(created_at)' 혹은 'ID' 순으로 정렬하여 기존 순서 복구
        operators = (operatorsResponse || []).sort((a, b) => {
            // created_at이 있다면 날짜순, 없다면 ID 문자열 순으로 정렬 (기존 등록 순서)
            const dateA = a.created_at || a.id;
            const dateB = b.created_at || b.id;
            return dateA.localeCompare(dateB);
        });
        
        // 3. 예약 데이터 로드 (중복 체크용)
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
        console.error('데이터 로드 오류:', error);
        showError('timesContainer', '데이터를 불러오는 중 오류가 발생했습니다.');
    }
}

/**
 * 화면 표시 (기존의 카드형 UI 및 요일 정렬 100% 복구)
 */
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
            // 기존의 예쁜 카드 스타일 구조 복구
            timeCard.innerHTML = `
                <div class="time-card-header">
                    <h3>${time.name}</h3>
                    <p>${time.day_of_week}요일 / ${time.time_range}</p>
                </div>
                <div class="operator-list" id="operators-${time.id}"></div>
            `;
            container.appendChild(timeCard);
            
            const operatorList = document.getElementById(`operators-${time.id}`);
            timeOperators.forEach(operator => {
                const operatorItem = document.createElement('div');
                operatorItem.className = 'operator-item';
                // 요청사항 반영: '학생' 단어 제거, 이름만 굵게 표시, 선택하기 텍스트 제거
                operatorItem.innerHTML = `
                    <div class="operator-info">
                        <span style="font-weight: 600; color: #2d3748; font-size: 1.1em;">${operator.name}</span>
                    </div>
                `;
                operatorItem.onclick = () => selectOperator(time.id, operator.id, time.name, operator.name);
                operatorList.appendChild(operatorItem);
            });
        }
    });
}

/**
 * 술자 선택 로직
 */
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

document.addEventListener('DOMContentLoaded', loadTimesAndOperators);
