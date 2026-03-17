// 예약 정보 확인(본인인증) 로직 전문

async function checkReservations() {
    const name = document.getElementById('nameInput').value.trim();
    const phone = document.getElementById('codeInput').value.trim();
    
    if (!name || !phone) {
        alert('이름과 연락처를 모두 입력해주세요.');
        return;
    }
    
    showLoading('reservationsSection');
    
    try {
        const allRes = await getData('reservations') || [];
        // 이름과 연락처가 모두 일치하는 예약 검색
        const myRes = allRes.filter(r => r.participant_name === name && r.participant_phone === phone);
        
        const authSection = document.getElementById('authSection');
        const resSection = document.getElementById('reservationsSection');
        
        authSection.style.display = 'none';
        resSection.style.display = 'block';
        
        if (myRes.length === 0) {
            resSection.innerHTML = `
                <div style="text-align:center; padding:40px 0;">
                    <p style="color:#666; margin-bottom:20px;">일치하는 예약 내역이 없습니다.</p>
                    <button class="btn btn-secondary" onclick="location.reload()">돌아가기</button>
                </div>
            `;
            return;
        }
        
        const operators = await getData('operators') || [];
        
        resSection.innerHTML = `
            <h3 style="margin-bottom:20px; text-align:center;">내 예약 내역</h3>
            ${myRes.map(r => {
                const op = operators.find(o => o.id === r.operator_id);
                return `
                    <div class="admin-card" style="margin-bottom:15px; background:#fff; border:1px solid #e2e8f0; padding:15px; border-radius:12px;">
                        <div class="admin-card-info">
                            <strong style="display:block; font-size:1.1em; margin-bottom:5px;">${formatDateDisplay(r.reservation_date)}</strong>
                            <span style="color:#666;">담당 술자: ${op ? op.name : '정보 없음'}</span>
                        </div>
                        <button class="btn btn-danger btn-sm" style="margin-top:10px;" onclick="cancelMyReservation('${r.id}')">예약 취소</button>
                    </div>
                `;
            }).join('')}
            <button class="btn btn-secondary" style="margin-top:20px;" onclick="location.reload()">처음으로 돌아가기</button>
        `;
    } catch (e) {
        alert('데이터 조회 중 오류가 발생했습니다.');
        location.reload();
    }
}

async function cancelMyReservation(id) {
    if (!confirm('정말로 예약을 취소하시겠습니까?')) return;
    try {
        await deleteData('reservations', id);
        alert('예약이 취소되었습니다.');
        checkReservations(); // 목록 새로고침
    } catch (e) { alert('취소 실패'); }
}
