// 예약 정보 확인 페이지 로직

const RS_PASSWORD = '0000';
const ADMIN_KEYWORD = '관리자';

let viewMode = null; // 'operator', 'rs', 'admin'
let currentOperator = null;
let currentTime = null;
let currentReservations = [];
let currentCancelReservationId = null;
let allOperators = [];
let allTimes = [];

// 예약 확인
async function checkReservations() {
    const nameInput = document.getElementById('nameInput').value.trim();
    const codeInput = document.getElementById('codeInput').value.trim();

    if (!nameInput) {
        alert('이름/타임 이름/관리자를 입력해주세요.');
        return;
    }

    if (!codeInput) {
        alert('학번/패스워드를 입력해주세요.');
        return;
    }

    try {
        allTimes = await getData('times', { limit: 1000 });
        allOperators = await getData('operators', { limit: 1000 });

        try {
            currentReservations = await getData('reservations', { limit: 5000 });
        } catch (error) {
            console.warn('예약 데이터 로드 실패:', error);
            currentReservations = [];
        }

        if (nameInput === ADMIN_KEYWORD && codeInput === RS_PASSWORD) {
            viewMode = 'admin';
            displayAdminView();
        } else if (codeInput === RS_PASSWORD) {
            currentTime = allTimes.find(t => t.name === nameInput);

            if (!currentTime) {
                alert('해당 타임을 찾을 수 없습니다. 타임 이름을 확인해주세요.');
                return;
            }

            viewMode = 'rs';
            displayRSView();
        } else {
            currentOperator = allOperators.find(op =>
                op.name === nameInput && op.student_id === codeInput
            );

            if (!currentOperator) {
                alert('일치하는 술자 정보를 찾을 수 없습니다. 이름과 학번을 확인해주세요.');
                return;
            }

            viewMode = 'operator';
            displayOperatorView();
        }

        document.getElementById('authSection').style.display = 'none';
        document.getElementById('reservationsSection').style.display = 'block';
    } catch (error) {
        console.error('예약 조회 오류:', error);
        alert('예약 정보를 불러오는 중 오류가 발생했습니다.');
    }
}

// 전체 관리자 뷰
function displayAdminView() {
    document.getElementById('viewerInfo').innerHTML = `
        <p style="font-size: 1.2em; margin: 0;">
            <strong>🔑 전체 관리자</strong>
        </p>
        <p style="margin: 10px 0 0 0; color: var(--text-light);">
            모든 타임의 전체 예약 내역
        </p>
    `;

    document.getElementById('listTitle').textContent = '전체 예약 목록';

    const container = document.getElementById('reservationsList');

    if (currentReservations.length === 0) {
        container.innerHTML = `
            <div class="notice-box" style="text-align: center; padding: 40px;">
                <p>예약이 없습니다.</p>
            </div>
        `;
        return;
    }

    currentReservations.sort((a, b) =>
        new Date(a.reservation_date) - new Date(b.reservation_date)
    );

    let html = `
        <div style="overflow-x: auto;">
            <table class="data-table" style="font-size: 0.8em;">
                <thead>
                    <tr>
                        <th>타임</th>
                        <th>술자</th>
                        <th>날짜</th>
                        <th>대상자</th>
                        <th>생년월일</th>
                        <th>성별</th>
                        <th>전화번호</th>
                        <th>주소</th>
                        <th>직업</th>
                        <th>관계</th>
                        <th>관리</th>
                    </tr>
                </thead>
                <tbody>
    `;

    currentReservations.forEach(reservation => {
        const operator = allOperators.find(op => op.id === reservation.operator_id);
        const time = allTimes.find(t => t.id === reservation.time_id);
        const isPast = isPastDate(reservation.reservation_date);
        const rowStyle = isPast ? 'opacity: 0.5;' : '';

        html += `
            <tr style="${rowStyle}">
                <td>${time ? time.name : '알수없음'}</td>
                <td>${operator ? operator.name : '알수없음'}</td>
                <td>${formatDateShort(reservation.reservation_date)}</td>
                <td>${reservation.participant_name || '-'}</td>
                <td>${reservation.participant_birthdate || '-'}</td>
                <td>${reservation.participant_gender || '-'}</td>
                <td>${reservation.participant_phone || '-'}</td>
                <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${reservation.participant_address || '-'}">
                    ${reservation.participant_address || '-'}
                </td>
                <td>${reservation.participant_occupation || '-'}</td>
                <td>${reservation.participant_relationship || '-'}</td>
                <td>
                    ${!isPast ? `
                        <button onclick="showCancelConfirmation('${reservation.id}', '${reservation.participant_name}', '${reservation.reservation_date}')"
                                style="background-color: var(--danger); color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer; font-size: 0.9em;">
                            취소
                        </button>
                    ` : '<span style="color: #999;">완료</span>'}
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
}

// RS 뷰
function displayRSView() {
    const timeOperators = allOperators.filter(op => op.time_id === currentTime.id);

    const timeReservations = currentReservations.filter(r =>
        timeOperators.some(op => op.id === r.operator_id)
    );

    document.getElementById('viewerInfo').innerHTML = `
        <p style="font-size: 1.2em; margin: 0;">
            <strong>📋 ${currentTime.name} RS</strong>
        </p>
        <p style="margin: 10px 0 0 0; color: var(--text-light);">
            ${currentTime.day_of_week}요일 ${currentTime.time_range} | 술자 ${timeOperators.length}명
        </p>
    `;

    document.getElementById('listTitle').textContent = `${currentTime.name} 예약 목록`;

    const container = document.getElementById('reservationsList');

    if (timeReservations.length === 0) {
        container.innerHTML = `
            <div class="notice-box" style="text-align: center; padding: 40px;">
                <p>예약이 없습니다.</p>
            </div>
        `;
        return;
    }

    timeReservations.sort((a, b) =>
        new Date(a.reservation_date) - new Date(b.reservation_date)
    );

    let html = `
        <div style="overflow-x: auto;">
            <table class="data-table" style="font-size: 0.9em;">
                <thead>
                    <tr>
                        <th>술자</th>
                        <th>날짜</th>
                        <th>대상자</th>
                        <th>관계</th>
                    </tr>
                </thead>
                <tbody>
    `;

    timeReservations.forEach(reservation => {
        const operator = allOperators.find(op => op.id === reservation.operator_id);
        const isPast = isPastDate(reservation.reservation_date);
        const rowStyle = isPast ? 'opacity: 0.5;' : '';

        html += `
            <tr style="${rowStyle}">
                <td>${operator ? operator.name : '알수없음'}</td>
                <td>${formatDateDisplay(reservation.reservation_date)}</td>
                <td>${reservation.participant_name || '-'}</td>
                <td>${reservation.participant_relationship || '-'}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
        <div class="notice-box" style="margin-top: 20px; background-color: #FFF9E6;">
            <p style="text-align: center; margin: 0; color: #CC8400;">
                <strong>※ RS 모드에서는 개인정보 보호를 위해 제한된 정보만 표시됩니다.</strong>
            </p>
        </div>
    `;

    container.innerHTML = html;
}

// 술자 개인 뷰
function displayOperatorView() {
    const operatorReservations = currentReservations.filter(r =>
        r.operator_id === currentOperator.id
    );

    const time = allTimes.find(t => t.id === currentOperator.time_id);

    document.getElementById('viewerInfo').innerHTML = `
        <p style="font-size: 1.2em; margin: 0;">
            <strong>${currentOperator.name}</strong> (${currentOperator.student_id})
        </p>
        <p style="margin: 10px 0 0 0; color: var(--text-light);">
            ${time ? `${time.name} ${time.day_of_week}요일 ${time.time_range}` : ''}
        </p>
    `;

    document.getElementById('listTitle').textContent = '내 예약 목록';

    const container = document.getElementById('reservationsList');

    if (operatorReservations.length === 0) {
        container.innerHTML = `
            <div class="notice-box" style="text-align: center; padding: 40px;">
                <p>아직 예약이 없습니다.</p>
            </div>
        `;
        return;
    }

    operatorReservations.sort((a, b) =>
        new Date(a.reservation_date) - new Date(b.reservation_date)
    );

    let html = '';

    operatorReservations.forEach((reservation, index) => {
        const isPast = isPastDate(reservation.reservation_date);
        const cardStyle = isPast ? 'opacity: 0.6; background-color: #f5f5f5;' : '';

        html += `
            <div class="time-card" style="${cardStyle}">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <h4 style="color: var(--primary-color); margin: 0;">예약 ${index + 1}</h4>
                    ${isPast ? '<span style="color: var(--text-light); font-size: 0.9em;">완료된 예약</span>' : ''}
                </div>

                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 15px;">
                    <p style="margin: 5px 0;"><strong>예약 날짜:</strong> ${formatDateDisplay(reservation.reservation_date)}</p>
                    <p style="margin: 5px 0;"><strong>대상자 이름:</strong> ${reservation.participant_name || '미입력'}</p>
                    <p style="margin: 5px 0;"><strong>생년월일:</strong> ${reservation.participant_birthdate || '미입력'}</p>
                    <p style="margin: 5px 0;"><strong>성별:</strong> ${reservation.participant_gender || '미입력'}</p>
                    <p style="margin: 5px 0;"><strong>전화번호:</strong> ${reservation.participant_phone || '미입력'}</p>
                    <p style="margin: 5px 0;"><strong>주소:</strong> ${reservation.participant_address || '미입력'}</p>
                    <p style="margin: 5px 0;"><strong>직업:</strong> ${reservation.participant_occupation || '미입력'}</p>
                    <p style="margin: 5px 0;"><strong>관계:</strong> ${reservation.participant_relationship || '미입력'}</p>
                </div>

                ${!isPast ? `
                    <button class="btn btn-danger" style="width: 100%;" onclick="showCancelConfirmation('${reservation.id}', '${reservation.participant_name}', '${reservation.reservation_date}')">
                        예약 취소하기
                    </button>
                ` : `
                    <p style="text-align: center; color: var(--text-light); margin: 0;">
                        지난 예약은 취소할 수 없습니다.
                    </p>
                `}
            </div>
        `;
    });

    container.innerHTML = html;
}

// 예약 취소 확인 모달
function showCancelConfirmation(reservationId, participantName, reservationDate) {
    currentCancelReservationId = reservationId;

    const confirmContent = document.getElementById('cancelConfirmContent');
    confirmContent.innerHTML = `
        <p><strong>대상자:</strong> ${participantName}</p>
        <p><strong>예약 날짜:</strong> ${formatDateDisplay(reservationDate)}</p>
        <p style="margin-top: 20px;">위 예약을 취소하시겠습니까?</p>
    `;

    showModal('cancelModal');
}

// 예약 취소 실행
async function confirmCancelReservation() {
    if (!currentCancelReservationId) {
        alert('취소할 예약을 선택해주세요.');
        return;
    }

    try {
        await deleteData('reservations', currentCancelReservationId);
        alert('예약이 취소되었습니다.');

        closeCancelModal();

        try {
            currentReservations = await getData('reservations', { limit: 5000 });
        } catch (error) {
            console.error('예약 목록 재로드 오류:', error);
            currentReservations = [];
        }

        if (viewMode === 'admin') {
            displayAdminView();
        } else if (viewMode === 'rs') {
            displayRSView();
        } else {
            displayOperatorView();
        }
    } catch (error) {
        console.error('예약 취소 오류:', error);
        alert('예약 취소 중 오류가 발생했습니다.');
    }
}

function closeCancelModal() {
    hideModal('cancelModal');
    currentCancelReservationId = null;
}

function resetSearch() {
    document.getElementById('nameInput').value = '';
    document.getElementById('codeInput').value = '';
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('reservationsSection').style.display = 'none';

    viewMode = null;
    currentOperator = null;
    currentTime = null;
    currentReservations = [];
}

document.addEventListener('DOMContentLoaded', function() {
    const nameInput = document.getElementById('nameInput');
    const codeInput = document.getElementById('codeInput');

    if (nameInput) {
        nameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') checkReservations();
        });
    }

    if (codeInput) {
        codeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') checkReservations();
        });
    }
});
