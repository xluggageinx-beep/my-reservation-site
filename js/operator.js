// 관리자 페이지 (술자모드) 로직 전문
async function loadReservationsSummary() {
    const summaryContainer = document.getElementById('reservationsSummary');
    showLoading('reservationsSummary');
    
    try {
        const [allRes, allTimes] = await Promise.all([
            getData('reservations'),
            getData('times')
        ]);

        const reservations = allRes || [];
        const times = allTimes || [];

        // 1. 타임별 예약 건수 계산 (사진 14번 UI)
        let statsHTML = `<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:15px; margin-top:20px;">`;
        
        times.forEach(t => {
            const count = reservations.filter(r => String(r.time_id) === String(t.id)).length;
            statsHTML += `
                <div class="stat-card" style="background:#f8fafc; border:1px solid #e2e8f0; padding:20px; border-radius:10px; text-align:center;">
                    <div style="font-size:0.9em; color:#64748b; margin-bottom:10px;">${t.name}</div>
                    <div style="font-size:1.8em; font-weight:bold; color:var(--primary-color);">${count}건</div>
                </div>
            `;
        });
        statsHTML += `</div>`;

        // 2. 전체 예약 리스트 테이블
        let tableHTML = `
            <div style="margin-top:30px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3 style="margin:0;">전체 예약 명단 (총 ${reservations.length}건)</h3>
                    <button class="btn btn-danger btn-sm" onclick="deleteAllReservations()">전체 삭제</button>
                </div>
                <div style="overflow-x:auto;">
                    <table class="admin-table" style="width:100%; border-collapse:collapse;">
                        <thead style="background:#f1f5f9;">
                            <tr>
                                <th>날짜</th><th>성함</th><th>연락처</th><th>타임</th><th>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reservations.map(r => {
                                const t = times.find(time => String(time.id) === String(r.time_id));
                                return `
                                <tr>
                                    <td>${r.reservation_date}</td>
                                    <td>${r.participant_name}</td>
                                    <td>${r.participant_phone}</td>
                                    <td>${t ? t.name : '삭제된 타임'}</td>
                                    <td><button class="btn btn-danger btn-xs" onclick="deleteReservation('${r.id}')">취소</button></td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        summaryContainer.innerHTML = statsHTML + tableHTML;

    } catch (e) {
        console.error(e);
        summaryContainer.innerHTML = '<p style="color:red; text-align:center;">데이터를 불러오는 중 오류가 발생했습니다.</p>';
    }
}
