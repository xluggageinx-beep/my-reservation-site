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
        // 데이터 병렬 로드
        const [timeData, operatorData, allReservations] = await Promise.all([
            getRecord('times', tid),
            getRecord('operators', oid),
            getData('reservations')
        ]);

        currentTime = timeData;
        currentOperator = operatorData;
        // 해당 술자에게 예약된 날짜 리스트 추출
        reservedDates = (allReservations || [])
            .filter(r => String(r.operator_id) === String(oid))
            .map(r => r.reservation_date);
        
        displayReservationInfo();
        displayAvailableDates();
    } catch (e) { 
        console.error(e);
        showError('dateGrid', '데이터를 불러오는 중 오류가 발생했습니다.'); 
    }
}

function displayReservationInfo() {
    const info = document.getElementById('operatorInfo');
    if (info && currentTime && currentOperator) {
        info.innerHTML = `
            <div class="selected-info-header" style="text-align:center; margin-bottom:30px;">
                <h2 style="color:var(--primary-color); font-size:1.8em; margin-bottom:10px;">예약 날짜 선택</h2>
                <p style="font-size:1.1em; color:#4a5568;">${currentOperator.name} 학생</p>
            </div>
            <div class="time-detail-box" style="border:1px solid #3182ce; border-radius:12px; padding:20px; margin-bottom:25px;">
                <h3 style="color:#2b6cb0; margin-bottom:8px;">${currentTime.name}</h3>
                <p><strong>요일:</strong> ${currentTime.day_of_week}요일</p>
                <p><strong>시간:</strong> ${currentTime.time_range}</p>
            </div>
        `;
    }
}

function displayAvailableDates() {
    const grid = document.getElementById('dateGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    // 사진과 동일한 2열 그리드 스타일
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    grid.style.gap = '15px';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDayIndex = dayIndexMap[currentTime.day_of_week];

    let foundDates = 0;
    // 향후 6주간의 날짜를 계산
    for (let i = 0; i < 42; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        
        if (d.getDay() === targetDayIndex) {
            const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
            const isReserved = reservedDates.includes(dateStr);
            
            const btn = document.createElement('div');
            // 예약된 날짜는 'reserved' 클래스 부여 (CSS에서 회색 처리)
            btn.className = `date-item ${isReserved ? 'reserved' : ''}`;
            
            // 인라인 스타일로 원본 디자인 복구
            btn.style.cssText = `
                padding: 20px 10px;
                background: ${isReserved ? '#edf2f7' : '#fff'};
                border: 2px solid ${isReserved ? '#cbd5e0' : '#3182ce'};
                border-radius: 12px;
                text-align: center;
                cursor: ${isReserved ? 'not-allowed' : 'pointer'};
                transition: transform 0.1s;
            `;
            
            btn.innerHTML = `
                <div style="font-size:0.9em; color:#718096; margin-bottom:5px;">${d.getMonth()+1}월</div>
                <div style="font-size:1.5em; font-weight:bold; color:${isReserved ? '#a0aec0' : '#2d3748'};">${d.getDate()}</div>
                <div style="font-size:0.85em; margin-top:5px; color:${isReserved ? '#e53e3e' : '#38a169'};">
                    ${isReserved ? '예약완료' : '예약가능'}
                </div>
            `;
            
            if (!isReserved) {
                btn.onclick = () => {
                    selectedDate = dateStr;
                    document.getElementById('modalDate').innerText = formatDateDisplay(dateStr);
                    showModal('confirmModal');
                };
            }
            grid.appendChild(btn);
            foundDates++;
        }
    }
}
