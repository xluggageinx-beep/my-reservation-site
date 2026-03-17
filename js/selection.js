// 술자 선택 페이지 로직 전문

let times = [];
let operators = [];
let reservations = [];

// 요일 순서 맵 (기존 로직 유지)
const dayOrder = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5 };

/**
 * 데이터 로드
 */
async function loadTimesAndOperators() {
    const container = document.getElementById('timesContainer');
    if (!container) return;
    
    showLoading('timesContainer');
    
    try {
        // 1. 타임 데이터 로드
        const tRes = await getData('times');
        times = tRes || [];
        
        // 2. 술자 데이터 로드 및 [등록 순서] 정렬
        const oRes = await getData('operators');
        // id 혹은 created_at을 기준으로 오름차순 정렬하여 등록 순서를 맞춤
        operators = (oRes || []).sort((a, b) => {
            const valA = a.created_at || a.id;
            const valB = b.created_at || b.id;
            return valA < valB ? -1 : (valA > valB ? 1 : 0);
        });
        
        // 3. 예약 데이터 로드 (중복 체크용)
        try {
            const rRes = await getData('reservations');
            reservations = rRes || [];
        } catch (resErr) {
            reservations = [];
        }
        
        displayTimesAndOperators();
    } catch (error) {
        showError('timesContainer', '데이터를 불러오는 중 오류가 발생했습니다.');
    }
}

/**
 * 화면 표시
 */
function displayTimesAndOperators() {
    const container = document.getElementById('timesContainer');
    container.innerHTML = '';
    
    // 요일 순서대로 타임 정렬
    const sortedTimes = [...times].sort((a, b) => (dayOrder[a.day_of_week] || 9) - (dayOrder[b.day_of_week] || 9));
    
    sortedTimes.forEach(time => {
        const timeOperators = operators.filter(op => String(op.time_id) === String(time.id));
        
        if (timeOperators.length > 0) {
            const timeCard = document.createElement('div');
            timeCard.className = 'time-card';
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
                // '학생' 제거, 이름만 표시
                operatorItem.innerHTML = `<span style="font-weight: 600;">${operator.name}</span>`;
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
