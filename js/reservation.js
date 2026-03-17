// 예약 날짜 선택 페이지 로직 전문
let currentTime = null;
let currentOperator = null;
let reservedDates = [];
let selectedDate = null;

const dayIndexMap = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 };

/**
 * 데이터 로드 및 렌더링 실행
 */
async function loadReservationData() {
    const tid = sessionStorage.getItem('selectedTimeId');
    const oid = sessionStorage.getItem('selectedOperatorId');
    
    if (!tid || !oid) { 
        window.location.href = 'selection.html'; 
        return; 
    }
    
    const grid = document.getElementById('dateGrid');
    if (grid) grid.innerHTML = '<div class="loading"></div>';
    
    try {
        // 모든 데이터를 완벽히 가져올 때까지 대기
        const [timeData, operatorData, allReservations] = await Promise.all([
            getRecord('times', tid),
            getRecord('operators', oid),
            getData('reservations')
        ]);

        currentTime = timeData;
        currentOperator = operatorData;
        // 해당 술자의 특정 타임에 예약된 날짜만 필터링
        reservedDates = (allReservations || [])
            .filter(r => String(r.operator_id) === String(oid))
            .map(r => r.reservation_date);
        
        displayReservationInfo();
        displayAvailableDates(); // 데이터 로드 후 호출
    } catch (e) { 
        console.error("데이터 로드 오류:", e);
        if (grid) grid.innerHTML = '<p class="error">날짜를 불러올 수 없습니다. 다시 시도해주세요.</p>';
    }
}

function displayReservationInfo() {
    const info = document.getElementById('operatorInfo');
    if (info && currentTime && currentOperator) {
        info.innerHTML = `
            <div class="selected-info-header" style="text-align:center; margin-bottom:20px;">
                <h2 style="color:var(--primary-color); font-size:1.5em; margin-bottom:5px;">날짜 선택</h2>
                <p style="font-size:1.1em; color:#4a5568;">${currentOperator.name} 학생 실습</p>
            </div>
            <div style="background:#f8faff; border:1px solid #3182ce; border-radius:12px; padding:15px; margin-bottom:20px; text-align:center;">
                <strong style="color:#2c5282;">${currentTime.name}</strong><br>
                <span style="font-size:0.9em; color:#4a5568;">(${currentTime.day_of_week}요일 / ${currentTime.time_range})</span>
            </div>
        `;
    }
}

/**
 * 날짜 버튼 생성 (예약된 날짜도 표시)
 */
function displayAvailableDates() {
    const grid = document.getElementById('dateGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    // 원본 디자인과 동일한 2열 그리드 강제
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    grid.style.gap = '12px';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDayIndex = dayIndexMap[currentTime.day_of_week];

    let foundCount = 0;
    // 향후 40일 이내에서 해당 요일 4개를 찾음
    for (let i = 0; i < 40; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        
        if (d.getDay() === targetDayIndex) {
            const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
            const isReserved = reservedDates.includes(dateStr);
            
            const btn = document.createElement('div');
            btn.className = `date-item ${isReserved ? 'reserved' : ''}`;
            
            // 인라인 스타일로 디자인 보정
            btn.style.cssText = `
                padding: 15px 10px;
                background: ${isReserved ? '#f1f5f9' : '#ffffff'};
                border: 2px solid ${isReserved ? '#cbd5e0' : '#3182ce'};
                border-radius: 12px;
                text-align: center;
                cursor: ${isReserved ? 'not-allowed' : 'pointer'};
                transition: transform 0.1s;
                display: flex;
                flex-direction: column;
                justify-content: center;
            `;
            
            btn.innerHTML = `
                <div style="font-size:0.8em; color:#718096;">${d.getMonth()+1}월</div>
                <div style="font-size:1.4em; font-weight:bold; margin:2px 0; color:${isReserved ? '#94a3b8' : '#2d3748'};">${d.getDate()}</div>
                <div style="font-size:0.8em; font-weight:600; color:${isReserved ? '#e53e3e' : '#38a169'};">
                    ${isReserved ? '예약완료' : '예약가능'}
                </div>
            `;
            
            if (!isReserved) {
                btn.onclick = () => {
                    selectedDate = dateStr;
                    const modalDate = document.getElementById('modalDate');
                    if (modalDate) modalDate.innerText = formatDateDisplay(dateStr);
                    showModal('confirmModal');
                };
            }
            grid.appendChild(btn);
            foundCount++;
            if (foundCount >= 4) break; // 4개만 표시
        }
    }
}

async function confirmReservation() {
    const btn = document.querySelector('#confirmModal .btn-primary');
    if(btn) btn.disabled = true; // 중복 클릭 방지

    const data = {
        id: generateUUID(),
        participant_name: sessionStorage.getItem('participantName'),
        participant_phone: sessionStorage.getItem('participantPhone'),
        participant_birthdate: sessionStorage.getItem('participantBirthdate'),
        participant_gender: sessionStorage.getItem('participantGender'),
        participant_address: sessionStorage.getItem('participantAddress'),
        participant_occupation: sessionStorage.getItem('participantOccupation'),
        participant_relationship: sessionStorage.getItem('participantRelationship'),
        operator_id: sessionStorage.getItem('selectedOperatorId'),
        time_id: sessionStorage.getItem('selectedTimeId'),
        reservation_date: selectedDate,
        consent_agreed: true
    };
    
    try {
        await createData('reservations', data);
        sessionStorage.setItem('reservationDate', selectedDate);
        window.location.href = 'success.html';
    } catch (e) { 
        alert('예약 저장 실패. 다시 시도해주세요.');
        if(btn) btn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', loadReservationData);
