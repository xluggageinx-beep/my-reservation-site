// 예약 정보 확인 페이지 로직

const RS_PASSWORD = '0000';
const ADMIN_KEYWORD = '관리자';

let viewMode = null; // 'operator', 'rs', 'admin'
let currentOperator = null;   // 단일 술자 (레거시, RS/admin에서만 사용)
let currentOperators = [];    // 전체 학기 내 동일 이름+학번 술자 목록
let currentTime = null;
let currentReservations = [];
let currentCancelReservationId = null;
let allOperators = [];
let allTimes = [];
let allSemesters = []; // 학기 목록 캐시
let selectedOperatorSemesterIds = []; // 술자 모드: 현재 선택된 학기 ID 목록

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
        allSemesters = await getData('semesters', { order: 'created_at.desc', limit: 100 });
        if (!Array.isArray(allSemesters)) allSemesters = [];

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
            // 활성 학기 ID 목록
            const activeSemIds = new Set(allSemesters.filter(s => s.is_active).map(s => s.id));

            // 활성 학기 타임만 대상
            const activeTimes = activeSemIds.size > 0
                ? allTimes.filter(t => activeSemIds.has(t.semester_id))
                : allTimes; // 학기 정보 없으면 전체 폴백

            // 동일 타임명이 활성 학기 내 여러 개인지 확인
            const matchedTimes = activeTimes.filter(t => normalizeText(t.name) === nameInput);

            if (matchedTimes.length === 0) {
                alert('해당 타임을 찾을 수 없습니다.\n활성 학기의 타임 이름을 확인해주세요.');
                return;
            }

            if (matchedTimes.length > 1) {
                // 중복 타임명: 학기명과 함께 선택하도록 안내
                const options = matchedTimes.map((t, i) => {
                    const sem = allSemesters.find(s => s.id === t.semester_id);
                    return `${i + 1}. ${t.name} (${sem ? sem.name : '학기미상'} / ${t.day_of_week}요일 ${t.time_range})`;
                }).join('\n');
                const choice = prompt(`타임명 "${nameInput}"이 여러 학기에 존재합니다.\n번호를 입력해 선택하세요:\n\n${options}`);
                const idx = parseInt(choice) - 1;
                if (isNaN(idx) || idx < 0 || idx >= matchedTimes.length) {
                    alert('올바른 번호를 입력해주세요.');
                    return;
                }
                currentTime = matchedTimes[idx];
            } else {
                currentTime = matchedTimes[0];
            }

            viewMode = 'rs';
            displayRSView();
        }
        // 술자 개인 모드
        else {
            const inputName = normalizeText(nameInput);
            const inputStudentId = normalizeDigits(codeInput);

            // 전체 학기에서 이름+학번 매칭 술자 검색 (학기 제한 없음)
            currentOperators = allOperators.filter(op => {
                const opName = normalizeText(op.name);
                const opStudentId = normalizeDigits(op.student_id);
                return opName === inputName && opStudentId === inputStudentId;
            });

            if (currentOperators.length === 0) {
                alert('일치하는 술자 정보를 찾을 수 없습니다.\n이름과 학번을 확인해주세요.');
                return;
            }

            // 레거시 단일 참조 유지
            currentOperator = currentOperators[0];
            viewMode = 'operator';

            // 학기 선택 UI 표시 (authSection 유지, semesterSection 표시)
            displaySemesterSelector(currentOperators);
            return; // 학기 선택 후 displayOperatorView 호출
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
// 학기 선택 UI (술자 모드)
// -------------------------------
function displaySemesterSelector(operators) {
    // 술자가 등록된 학기 ID 수집
    const operatorSemIds = new Set(
        operators.map(op => op.semester_id).filter(Boolean)
    );

    // 해당 학기만 추출, 생성일 내림차순 (allSemesters는 이미 created_at.desc)
    const relatedSemesters = allSemesters.filter(s => operatorSemIds.has(s.id));

    // 학기 정보가 없을 경우 폴백: 전체 학기 기준 표시
    const displaySemesters = relatedSemesters.length > 0 ? relatedSemesters : allSemesters.slice(0, 5);

    // 활성 학기 ID Set
    const activeSemIds = new Set(allSemesters.filter(s => s.is_active).map(s => s.id));

    // 활성 학기 기본 선택
    const defaultSelected = displaySemesters
        .filter(s => activeSemIds.has(s.id))
        .map(s => s.id);
    selectedOperatorSemesterIds = defaultSelected.length > 0
        ? defaultSelected
        : (displaySemesters.length > 0 ? [displaySemesters[0].id] : []);

    // 학기 선택 섹션 렌더링
    const semesterSection = document.getElementById('semesterSection');
    if (!semesterSection) return;

    const first = operators[0];

    semesterSection.innerHTML = `
        <div style="background:#f0f5ff;border:1.5px solid #c7d9ff;border-radius:12px;padding:20px 20px 16px;margin-bottom:20px;">
            <div style="margin-bottom:4px;">
                <span style="font-size:1.1em;font-weight:700;color:var(--primary-color);">${first.name}</span>
                <span style="font-size:0.9em;color:#666;margin-left:8px;">(${first.student_id})</span>
            </div>
            <div style="font-size:0.82em;color:#888;margin-bottom:16px;">등록된 학기를 선택하면 해당 학기의 예약이 표시됩니다. 복수 선택 가능합니다.</div>
            <div id="semesterButtons" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
                ${displaySemesters.map(sem => {
                    const isActive = activeSemIds.has(sem.id);
                    const isSelected = selectedOperatorSemesterIds.includes(sem.id);
                    return `
                        <button
                            id="semBtn_${sem.id}"
                            onclick="toggleSemesterSelection('${sem.id}')"
                            style="
                                padding:8px 16px;
                                border-radius:20px;
                                border:2px solid ${isActive ? '#3b82f6' : '#d1d5db'};
                                background:${isSelected ? (isActive ? '#3b82f6' : '#374151') : (isActive ? '#eff6ff' : '#f9fafb')};
                                color:${isSelected ? '#fff' : (isActive ? '#1d4ed8' : '#374151')};
                                font-size:0.9em;
                                font-weight:${isActive ? '700' : '500'};
                                cursor:pointer;
                                transition:all 0.15s;
                                display:inline-flex;
                                align-items:center;
                                gap:6px;
                            "
                        >
                            ${sem.name}
                            ${isActive ? '<span style="font-size:0.72em;background:' + (isSelected ? 'rgba(255,255,255,0.25)' : '#3b82f6') + ';color:#fff;padding:2px 6px;border-radius:10px;font-weight:700;">활성</span>' : ''}
                        </button>
                    `;
                }).join('')}
            </div>
            <button
                onclick="applyOperatorSemesterFilter()"
                style="width:100%;padding:11px;background:var(--primary-color);color:#fff;border:none;border-radius:8px;font-size:1em;font-weight:700;cursor:pointer;"
            >
                선택한 학기 예약 보기
            </button>
        </div>
    `;

    semesterSection.style.display = 'block';
}

function toggleSemesterSelection(semId) {
    const idx = selectedOperatorSemesterIds.indexOf(semId);
    if (idx === -1) {
        selectedOperatorSemesterIds.push(semId);
    } else {
        if (selectedOperatorSemesterIds.length === 1) return; // 최소 1개 유지
        selectedOperatorSemesterIds.splice(idx, 1);
    }

    // 활성 학기 판별
    const activeSemIds = new Set(allSemesters.filter(s => s.is_active).map(s => s.id));

    // 버튼 스타일 갱신
    selectedOperatorSemesterIds.forEach(_id => {
        // 다시 전체 버튼 순회로 갱신
    });

    // 전체 학기 버튼 재렌더 (allSemesters 참조)
    allSemesters.forEach(sem => {
        const btn = document.getElementById(`semBtn_${sem.id}`);
        if (!btn) return;
        const isActive = activeSemIds.has(sem.id);
        const isSelected = selectedOperatorSemesterIds.includes(sem.id);
        btn.style.border = `2px solid ${isActive ? '#3b82f6' : '#d1d5db'}`;
        btn.style.background = isSelected ? (isActive ? '#3b82f6' : '#374151') : (isActive ? '#eff6ff' : '#f9fafb');
        btn.style.color = isSelected ? '#fff' : (isActive ? '#1d4ed8' : '#374151');
        // 활성 뱃지 색상 갱신
        const badge = btn.querySelector('span');
        if (badge) {
            badge.style.background = isSelected ? 'rgba(255,255,255,0.25)' : '#3b82f6';
        }
    });
}

function applyOperatorSemesterFilter() {
    if (selectedOperatorSemesterIds.length === 0) {
        alert('학기를 하나 이상 선택해주세요.');
        return;
    }
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('semesterSection').style.display = 'none';
    document.getElementById('reservationsSection').style.display = 'block';
    displayOperatorView();
    updateExportButtonVisibility();
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
                        <th>학기</th>
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
        const semester = time ? allSemesters.find(s => s.id === time.semester_id) : null;
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
                <td>${semester ? semester.name : '-'}</td>
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

    // 해당 타임의 학기 정보
    const timeSemester = allSemesters.find(s => s.id === currentTime.semester_id);
    const semLabel = timeSemester ? ` (${timeSemester.name})` : '';

    document.getElementById('viewerInfo').innerHTML = `
        <p style="font-size: 1.2em; margin: 0;">
            <strong>📋 ${currentTime.name}${semLabel} RS</strong>
        </p>
        <p style="margin: 10px 0 0 0; color: var(--text-light);">
            ${currentTime.day_of_week}요일 ${currentTime.time_range} | 술자 ${timeOperators.length}명
        </p>
    `;

    document.getElementById('listTitle').textContent = `${currentTime.name}${semLabel} 예약 목록`;

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
// 만나이 계산 유틸
// -------------------------------
function calcKoreanAge(birthdateStr) {
    if (!birthdateStr || birthdateStr === '-' || birthdateStr === '미입력') return null;
    // YYYY-MM-DD 또는 YYYYMMDD 형식 처리
    const clean = String(birthdateStr).replace(/\D/g, '');
    if (clean.length < 8) return null;
    const year  = parseInt(clean.slice(0, 4));
    const month = parseInt(clean.slice(4, 6)) - 1;
    const day   = parseInt(clean.slice(6, 8));
    const birth = new Date(year, month, day);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const notYet = today.getMonth() < birth.getMonth() ||
        (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
    if (notYet) age--;
    return age < 0 ? null : age;
}

// -------------------------------
// 술자 개인 뷰
// -------------------------------
function displayOperatorView() {
    const allMatchedOperators = currentOperators.length > 0 ? currentOperators : (currentOperator ? [currentOperator] : []);

    // 선택된 학기에 속하는 술자만 필터링
    const operators = selectedOperatorSemesterIds.length > 0
        ? allMatchedOperators.filter(op => selectedOperatorSemesterIds.includes(op.semester_id))
        : allMatchedOperators;

    // 표시할 술자가 없으면 전체로 폴백
    const displayOperators = operators.length > 0 ? operators : allMatchedOperators;

    // 헤더: 첫 번째 술자 기준
    const first = displayOperators[0];

    // 선택된 학기명 레이블
    const selectedSemLabels = displayOperators.map(op => {
        const sem = allSemesters.find(s => s.id === op.semester_id);
        const t   = allTimes.find(t => t.id === op.time_id);
        return sem ? `${sem.name}${t ? ' ' + t.name : ''}` : (t ? t.name : '');
    }).filter(Boolean);

    // 중복 제거
    const uniqueLabels = [...new Set(selectedSemLabels)];

    document.getElementById('viewerInfo').innerHTML = `
        <p style="font-size: 1.2em; margin: 0;">
            <strong>${first.name}</strong> (${first.student_id})
        </p>
        <p style="margin: 8px 0 0 0; color: var(--text-light); font-size:0.9em;">
            ${uniqueLabels.join(' · ')}
        </p>
    `;

    document.getElementById('listTitle').textContent = '내 예약 목록';
    const container = document.getElementById('reservationsList');

    // 선택된 학기 술자들의 예약 수집
    const operatorIds = new Set(displayOperators.map(op => op.id));
    const allOpReservations = currentReservations.filter(r => operatorIds.has(r.operator_id));

    if (allOpReservations.length === 0) {
        container.innerHTML = `
            <div class="notice-box" style="text-align: center; padding: 40px;">
                <p>아직 예약이 없습니다.</p>
            </div>
        `;
        updateExportButtonVisibility();
        return;
    }

    // 날짜 오름차순 정렬
    allOpReservations.sort((a, b) => new Date(a.reservation_date) - new Date(b.reservation_date));

    let html = '';

    allOpReservations.forEach((reservation) => {
        const isPast = isPastDate(reservation.reservation_date);

        const participantName = getReservationField(reservation, ['participant_name', 'name'], '미입력');
        const birthdate  = getReservationField(reservation, ['participant_birthdate', 'birthdate', 'participant_birth'], '');
        const gender     = getReservationField(reservation, ['participant_gender', 'gender'], '');
        const phone      = getReservationField(reservation, ['participant_phone', 'phone'], '미입력');
        const address    = getReservationField(reservation, ['participant_address', 'address'], '미입력');
        const occupation = getReservationField(reservation, ['participant_occupation', 'occupation'], '미입력');
        const relationship = getReservationField(reservation, ['participant_relationship', 'relationship'], '미입력');

        // 만나이 계산
        const age = calcKoreanAge(birthdate);
        const birthdateDisplay = birthdate || '미입력';
        const ageDisplay = age !== null ? `${age}세` : '';
        const genderDisplay = gender || '';

        // 카드 제목: "예약 일자 — 대상자 이름 (생년월일 / 나이 / 성별)"
        const metaParts = [birthdateDisplay, ageDisplay, genderDisplay].filter(v => v && v !== '미입력');
        const metaStr = metaParts.length > 0 ? ` (${metaParts.join(' / ')})` : '';
        const cardTitle = `${formatDateDisplay(reservation.reservation_date)} — ${participantName}${metaStr}`;

        // 상태 배지
        const statusBadge = isPast
            ? `<span style="font-size:0.78em;padding:3px 10px;border-radius:20px;background:#e8e8e8;color:#888;font-weight:600;letter-spacing:0.02em;">완료</span>`
            : `<span style="font-size:0.78em;padding:3px 10px;border-radius:20px;background:#e8f4ff;color:var(--primary-color);font-weight:600;letter-spacing:0.02em;">예정</span>`;

        // 삭제 버튼 (항상 표시)
        const deleteBtn = `
            <button onclick="showCancelConfirmation('${reservation.id}', '${participantName.replace(/'/g, "\\'")}', '${reservation.reservation_date}')"
                style="background:var(--danger);color:#fff;border:none;border-radius:8px;
                       width:32px;height:32px;font-size:1em;cursor:pointer;
                       display:flex;align-items:center;justify-content:center;flex-shrink:0;line-height:1;"
                title="예약 삭제">✕</button>`;

        // 카드 테두리/배경: 완료=회색, 예정=기본
        const cardBorder = isPast
            ? 'border:1.5px solid #d4d4d4;background:#f9f9f9;'
            : 'border:1.5px solid #c7d9ff;background:#fff;';

        html += `
            <div class="time-card" style="margin-bottom:16px;padding:20px 20px 18px;${cardBorder}${isPast ? 'opacity:0.80;' : ''}">
                <!-- 카드 헤더 -->
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:16px;">
                    <div style="font-size:1.05em;font-weight:700;color:${isPast ? '#888' : 'var(--primary-color)'};line-height:1.5;flex:1;">
                        ${cardTitle}
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;margin-top:2px;">
                        ${statusBadge}
                        ${deleteBtn}
                    </div>
                </div>

                <!-- 2열 2행 상세 정보 -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;">
                    <div style="background:${isPast ? '#f0f0f0' : '#f0f5ff'};border-radius:7px;padding:10px 13px;">
                        <div style="font-size:0.72em;color:#aaa;margin-bottom:4px;">전화번호</div>
                        <div style="font-size:0.9em;color:#333;">${phone}</div>
                    </div>
                    <div style="background:${isPast ? '#f0f0f0' : '#f0f5ff'};border-radius:7px;padding:10px 13px;">
                        <div style="font-size:0.72em;color:#aaa;margin-bottom:4px;">직업</div>
                        <div style="font-size:0.9em;color:#333;">${occupation}</div>
                    </div>
                    <div style="background:${isPast ? '#f0f0f0' : '#f0f5ff'};border-radius:7px;padding:10px 13px;">
                        <div style="font-size:0.72em;color:#aaa;margin-bottom:4px;">주소</div>
                        <div style="font-size:0.9em;color:#333;word-break:break-all;">${address}</div>
                    </div>
                    <div style="background:${isPast ? '#f0f0f0' : '#f0f5ff'};border-radius:7px;padding:10px 13px;">
                        <div style="font-size:0.72em;color:#aaa;margin-bottom:4px;">관계</div>
                        <div style="font-size:0.9em;color:#333;">${relationship}</div>
                    </div>
                </div>
            </div>`;
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
        '학기',
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
        const semester = time ? allSemesters.find(s => s.id === time.semester_id) : null;

        return [
            semester ? semester.name : '-',
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
    const semSec = document.getElementById('semesterSection');
    if (semSec) semSec.style.display = 'none';

    viewMode = null;
    currentOperator = null;
    currentOperators = [];
    currentTime = null;
    currentReservations = [];
    selectedOperatorSemesterIds = [];
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
