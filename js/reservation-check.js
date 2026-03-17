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

// -------------------------------
// 공통 유틸
// -------------------------------
function normalizeText(value) {
    return String(value ?? '').trim();
}

function normalizeDigits(value) {
    return String(value ?? '').replace(/\D/g, '');
}

function getReservationField(reservation, keys, fallback = '-') {
    for (const key of keys) {
        const value = reservation?.[key];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            return value;
        }
    }
    return fallback;
}

function escapeCsv(value) {
    const text = String(value ?? '');
    if (text.includes('"') || text.includes(',') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

function updateExportButtonVisibility() {
    const wrap = document.getElementById('exportButtonWrap');
    if (!wrap) return;

    if (viewMode === 'admin' && currentReservations.length > 0) {
        wrap.style.display = 'block';
    } else {
        wrap.style.display = 'none';
    }
}

// -------------------------------
// 예약 확인
// -------------------------------
async function checkReservations() {
    const nameInput = normalizeText(document.getElementById('nameInput').value);
    const codeInput = normalizeText(document.getElementById('codeInput').value);

    if (!nameInput) {
        alert('이름 또는 타임 이름을 입력해주세요.');
        return;
    }

    if (!codeInput) {
        alert('학번 또는 패스워드를 입력해주세요.');
        return;
    }

    try {
        console.log('예약 확인 시작...');

        allTimes = await getData('times', { limit: 1000 });
        allOperators = await getData('operators', { limit: 1000 });

        try {
            currentReservations = await getData('reservations', {
                limit: 5000,
                order: 'reservation_date.asc'
            });
        } catch (error) {
            console.warn('예약 데이터 로드 실패:', error);
            currentReservations = [];
        }

        console.log('times:', allTimes.length);
        console.log('operators:', allOperators.length);
        console.log('reservations:', currentReservations.length);
        console.log('operator sample:', allOperators.slice(0, 5));

        // 관리자 모드 (히든)
        if (nameInput === ADMIN_KEYWORD && codeInput === RS_PASSWORD) {
            viewMode = 'admin';
            displayAdminView();
        }
        // RS 모드
        else if (codeInput === RS_PASSWORD) {
            currentTime = allTimes.find(t => normalizeText(t.name) === nameInput);

            if (!currentTime) {
                alert('해당 타임을 찾을 수 없습니다. 타임 이름을 확인해주세요.');
                return;
            }

            viewMode = 'rs';
            displayRSView();
        }
        // 술자 개인 모드
        else {
            const inputName = normalizeText(nameInput);
            const inputStudentId = normalizeDigits(codeInput);

            currentOperator = allOperators.find(op => {
                const opName = normalizeText(op.name);
                const opStudentId = normalizeDigits(op.student_id);
                return opName === inputName && opStudentId === inputStudentId;
            });

            if (!currentOperator) {
                console.log('입력 이름:', inputName);
                console.log('입력 학번:', inputStudentId);
                console.log('비교용 operators:', allOperators.map(op => ({
                    name: normalizeText(op.name),
                    student_id: normalizeDigits(op.student_id),
                    raw_student_id: op.student_id
                })));

                alert('일치하는 술자 정보를 찾을 수 없습니다. 이름과 학번을 확인해주세요.');
                return;
            }

            viewMode = 'operator';
            displayOperatorView();
        }

        document.getElementById('authSection').style.display = 'none';
        document.getElementById('reservationsSection').style.display = 'block';
        updateExportButtonVisibility();
    } catch (error) {
        console.error('예약 조회 오류:', error);
        alert('예약 정보를 불러오는 중 오류가 발생했습니다.');
    }
}

// -------------------------------
// 관리자 뷰
// -------------------------------
function displayAdminView() {
    document.getElementById('viewerInfo').innerHTML = `
        <p style="font-size: 1.2em; margin: 0;">
            <strong>예약 전체 관리</strong>
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
        updateExportButtonVisibility();
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

        const participantName = getReservationField(reservation, ['participant_name', 'name']);
        const birthdate = getReservationField(reservation, ['participant_birthdate', 'birthdate', 'participant_birth']);
        const gender = getReservationField(reservation, ['participant_gender', 'gender']);
        const phone = getReservationField(reservation, ['participant_phone', 'phone']);
        const address = getReservationField(reservation, ['participant_address', 'address']);
        const occupation = getReservationField(reservation, ['participant_occupation', 'occupation']);
        const relationship = getReservationField(reservation, ['participant_relationship', 'relationship']);

        html += `
            <tr style="${rowStyle}">
                <td>${time ? time.name : '알수없음'}</td>
                <td>${operator ? operator.name : '알수없음'}</td>
                <td>${formatDateShort(reservation.reservation_date)}</td>
                <td>${participantName}</td>
                <td>${birthdate}</td>
                <td>${gender}</td>
                <td>${phone}</td>
                <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${address}">
                    ${address}
                </td>
                <td>${occupation}</td>
                <td>${relationship}</td>
                <td>
                    ${!isPast ? `
                        <button onclick="showCancelConfirmation('${reservation.id}', '${participantName}', '${reservation.reservation_date}')"
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
    updateExportButtonVisibility();
}

// -------------------------------
// RS 뷰
// -------------------------------
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
        updateExportButtonVisibility();
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

        const participantName = getReservationField(reservation, ['participant_name', 'name']);
        const relationship = getReservationField(reservation, ['participant_relationship', 'relationship']);

        html += `
            <tr style="${rowStyle}">
                <td>${operator ? operator.name : '알수없음'}</td>
                <td>${formatDateDisplay(reservation.reservation_date)}</td>
                <td>${participantName}</td>
                <td>${relationship}</td>
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
    updateExportButtonVisibility();
}

// -------------------------------
// 술자 개인 뷰
// -------------------------------
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
        updateExportButtonVisibility();
        return;
    }

    operatorReservations.sort((a, b) =>
        new Date(a.reservation_date) - new Date(b.reservation_date)
    );

    let html = '';

    operatorReservations.forEach((reservation, index) => {
        const isPast = isPastDate(reservation.reservation_date);
        const cardStyle = isPast ? 'opacity: 0.6; background-color: #f5f5f5;' : '';

        const participantName = getReservationField(reservation, ['participant_name', 'name'], '미입력');
        const birthdate = getReservationField(reservation, ['participant_birthdate', 'birthdate', 'participant_birth'], '미입력');
        const gender = getReservationField(reservation, ['participant_gender', 'gender'], '미입력');
        const phone = getReservationField(reservation, ['participant_phone', 'phone'], '미입력');
        const address = getReservationField(reservation, ['participant_address', 'address'], '미입력');
        const occupation = getReservationField(reservation, ['participant_occupation', 'occupation'], '미입력');
        const relationship = getReservationField(reservation, ['participant_relationship', 'relationship'], '미입력');

        html += `
            <div class="time-card" style="${cardStyle}">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <h4 style="color: var(--primary-color); margin: 0;">예약 ${index + 1}</h4>
                    ${isPast ? '<span style="color: var(--text-light); font-size: 0.9em;">완료된 예약</span>' : ''}
                </div>

                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 15px;">
                    <p style="margin: 5px 0;"><strong>예약 날짜:</strong> ${formatDateDisplay(reservation.reservation_date)}</p>
                    <p style="margin: 5px 0;"><strong>대상자 이름:</strong> ${participantName}</p>
                    <p style="margin: 5px 0;"><strong>생년월일:</strong> ${birthdate}</p>
                    <p style="margin: 5px 0;"><strong>성별:</strong> ${gender}</p>
                    <p style="margin: 5px 0;"><strong>전화번호:</strong> ${phone}</p>
                    <p style="margin: 5px 0;"><strong>주소:</strong> ${address}</p>
                    <p style="margin: 5px 0;"><strong>직업:</strong> ${occupation}</p>
                    <p style="margin: 5px 0;"><strong>관계:</strong> ${relationship}</p>
                </div>

                ${!isPast ? `
                    <button class="btn btn-danger" style="width: 100%;" onclick="showCancelConfirmation('${reservation.id}', '${participantName}', '${reservation.reservation_date}')">
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
    updateExportButtonVisibility();
}

// -------------------------------
// CSV 다운로드 (엑셀 열기용)
// -------------------------------
function downloadReservationsCsv() {
    if (viewMode !== 'admin') {
        alert('관리자 화면에서만 다운로드할 수 있습니다.');
        return;
    }

    if (!currentReservations || currentReservations.length === 0) {
        alert('다운로드할 예약 데이터가 없습니다.');
        return;
    }

    const header = [
        '타임',
        '술자',
        '예약날짜',
        '대상자명',
        '생년월일',
        '성별',
        '전화번호',
        '주소',
        '직업',
        '관계'
    ];

    const rows = currentReservations.map(reservation => {
        const operator = allOperators.find(op => op.id === reservation.operator_id);
        const time = allTimes.find(t => t.id === reservation.time_id);

        return [
            time ? time.name : '알수없음',
            operator ? operator.name : '알수없음',
            reservation.reservation_date || '-',
            getReservationField(reservation, ['participant_name', 'name']),
            getReservationField(reservation, ['participant_birthdate', 'birthdate', 'participant_birth']),
            getReservationField(reservation, ['participant_gender', 'gender']),
            getReservationField(reservation, ['participant_phone', 'phone']),
            getReservationField(reservation, ['participant_address', 'address']),
            getReservationField(reservation, ['participant_occupation', 'occupation']),
            getReservationField(reservation, ['participant_relationship', 'relationship'])
        ].map(escapeCsv).join(',');
    });

    const csvContent = '\uFEFF' + [header.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    const link = document.createElement('a');
    link.href = url;
    link.download = `예약목록_${yyyy}${mm}${dd}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// -------------------------------
// 예약 취소 확인 모달
// -------------------------------
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

// -------------------------------
// 예약 취소 실행
// -------------------------------
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
            currentReservations = await getData('reservations', {
                limit: 5000,
                order: 'reservation_date.asc'
            });
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

// -------------------------------
// 예약 취소 모달 닫기
// -------------------------------
function closeCancelModal() {
    hideModal('cancelModal');
    currentCancelReservationId = null;
}

// -------------------------------
// 검색 초기화
// -------------------------------
function resetSearch() {
    document.getElementById('nameInput').value = '';
    document.getElementById('codeInput').value = '';
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('reservationsSection').style.display = 'none';

    viewMode = null;
    currentOperator = null;
    currentTime = null;
    currentReservations = [];
    updateExportButtonVisibility();
}

// -------------------------------
// 페이지 로드 시
// -------------------------------
document.addEventListener('DOMContentLoaded', function() {
    const nameInput = document.getElementById('nameInput');
    const codeInput = document.getElementById('codeInput');

    if (nameInput) {
        nameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkReservations();
            }
        });
    }

    if (codeInput) {
        codeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkReservations();
            }
        });
    }

    updateExportButtonVisibility();
});
