// 예약 완료 페이지 로직

function displayReservationInfo() {
    const participantName = sessionStorage.getItem('participantName');
    const participantPhone = sessionStorage.getItem('participantPhone');
    const reservationDate = sessionStorage.getItem('reservationDate');
    const timeName = sessionStorage.getItem('selectedTimeName');
    const operatorName = sessionStorage.getItem('selectedOperatorName');

    const infoContainer = document.getElementById('reservationInfo');
    if (!infoContainer) return;

    infoContainer.innerHTML = `
        <h4 style="color: var(--primary-color); margin-bottom: 20px; font-size: 1.3em;">예약 정보</h4>
        <div style="text-align: left; line-height: 2;">
            <p><strong>예약자:</strong> ${participantName || '-'}</p>
            <p><strong>연락처:</strong> ${participantPhone || '-'}</p>
            <p><strong>예약 날짜:</strong> ${reservationDate ? formatDateDisplay(reservationDate) : '-'}</p>
            <p><strong>타임:</strong> ${timeName || '-'}</p>
            <p><strong>담당 술자:</strong> ${operatorName ? `${operatorName} 학생` : '-'}</p>
        </div>
    `;
}

function clearTemporaryReservationSession() {
    sessionStorage.removeItem('selectedTimeId');
    sessionStorage.removeItem('selectedOperatorId');
    sessionStorage.removeItem('selectedTimeName');
    sessionStorage.removeItem('selectedOperatorName');
    sessionStorage.removeItem('reservationDate');
}

document.addEventListener('DOMContentLoaded', function() {
    const reservationId = sessionStorage.getItem('reservationId');

    if (!reservationId) {
        alert('예약 정보를 찾을 수 없습니다.');
        window.location.href = 'index.html';
        return;
    }

    displayReservationInfo();
    clearTemporaryReservationSession();
});
