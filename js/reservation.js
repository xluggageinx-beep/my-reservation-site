// 예약 날짜 선택 페이지 로직 전문
let currentTime = null;
let currentOperator = null;
let reservedDates = [];
let selectedDate = null;

const dayIndexMap = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 };

async function loadReservationData() {
    const tid = sessionStorage.getItem('selectedTimeId');
    const oid = sessionStorage.getItem('selectedOperatorId');
    
    if (!tid || !oid) { window.location.href = 'selection.html'; return; }
    
    showLoading('dateGrid');
    
    try {
        currentTime = await getRecord('times', tid);
        currentOperator = await getRecord('operators', oid);
        const res = await getData('reservations');
        reservedDates = (res || []).filter(r => r.operator_id === oid).map(r => r.reservation_date);
        
        displayReservationInfo();
        displayAvailableDates();
    } catch (e) { showError('dateGrid', '날짜 로딩 중 오류가 발생했습니다.'); }
}

function displayReservationInfo() {
    const info = document.getElementById('operatorInfo');
    if (info && currentTime && currentOperator) {
        info.innerHTML = `
            <div class="selected-info-card" style="background:#fff; padding:20px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:20px;">
                <p style="margin-bottom:8px; font-size:1.1em;"><strong>담당 술자:</strong> <span style="color:var(--primary-color);">${currentOperator.name}</span></p>
                <p style="color:#666;"><strong>실습 타임:</strong> ${currentTime.name} (${currentTime.day_of_week}요일 / ${currentTime.time_range})</p>
            </div>
        `;
    }
}

function displayAvailableDates() {
    const grid = document.getElementById('dateGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    // [중요] 균일한 버튼 그리드 디자인 적용
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    grid.style.gap = '12px';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDayIndex = dayIndexMap[currentTime.day_of_week];

    let count = 0;
    for (let i = 0; i < 35; i++) { // 5주치 중 해당 요일 찾기
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        
        if (d.getDay() === targetDayIndex) {
            const dateStr = d.toISOString().split('T')[0];
            const isReserved = reservedDates.includes(dateStr);
            
            const btn = document.createElement('div');
            btn.className = `date-item ${isReserved ? 'reserved' : ''}`;
            btn.style.cssText = `
                padding: 18px 10px;
                background: ${isReserved ? '#f1f1f1' : '#fff'};
                border: 1px solid ${isReserved ? '#ddd' : '#3182ce'};
                border-radius: 12px;
                text-align: center;
                cursor: ${isReserved ? 'not-allowed' : 'pointer'};
                transition: all 0.2s;
            `;
            
            btn.innerHTML = `
                <div style="font-size:0.85em; color:#718096;">${d.getMonth()+1}월</div>
                <div style="font-size:1.3em; font-weight:bold; margin:3px 0; color:${isReserved ? '#999' : '#2d3748'};">${d.getDate()}</div>
                <div style="font-size:0.8em; color:${isReserved ? '#e53e3e' : '#38a169'};">${isReserved ? '예약불가' : '예약가능'}</div>
            `;
            
            if (!isReserved) {
                btn.onclick = () => {
                    selectedDate = dateStr;
                    document.getElementById('modalDate').innerText = formatDateDisplay(dateStr);
                    showModal('confirmModal');
                };
            }
            grid.appendChild(btn);
            count++;
            if (count >= 4) break; // 4개 날짜만 노출
        }
    }
}

async function confirmReservation() {
    const data = {
        id: generateUUID(),
        participant_name: sessionStorage.getItem('participantName'),
        participant_birthdate: sessionStorage.getItem('participantBirthdate'),
        participant_gender: sessionStorage.getItem('participantGender'),
        participant_phone: sessionStorage.getItem('participantPhone'),
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
    } catch (e) { alert('예약 중 오류가 발생했습니다.'); }
}

document.addEventListener('DOMContentLoaded', loadReservationData);
