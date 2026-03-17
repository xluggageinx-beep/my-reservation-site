// 동의서 페이지 로직

let consentStatus = {
    personalInfo: false,
    healthInfo: false,
    thirdParty: false,
    program: false
};

// 모든 동의 항목 체크
function checkAllConsents() {
    const personalInfoConsent = document.getElementById('consentPersonalInfo').checked;
    const healthInfoConsent = document.getElementById('consentHealthInfo').checked;
    const thirdPartyConsent = document.getElementById('consentThirdParty').checked;
    const programConsent = document.getElementById('consentProgram').checked;
    
    consentStatus.personalInfo = personalInfoConsent;
    consentStatus.healthInfo = healthInfoConsent;
    consentStatus.thirdParty = thirdPartyConsent;
    consentStatus.program = programConsent;
    
    const allChecked = personalInfoConsent && healthInfoConsent && thirdPartyConsent && programConsent;
    document.getElementById('nextButton').disabled = !allChecked;
}

// 동의서 내용 표시
function showConsentDocument() {
    showModal('consentModal');
}

// 동의서 모달 닫기
function closeConsentModal() {
    hideModal('consentModal');
}

// 동의서에 동의
function agreeToConsent() {
    document.getElementById('consentProgram').disabled = false;
    document.getElementById('consentProgram').checked = true;
    consentStatus.program = true;
    checkAllConsents();
    hideModal('consentModal');
    alert('동의서에 동의하셨습니다. 내원 시 실물 서류 작성이 필요합니다.');
}

// 다음 단계로 진행
function proceedToInfo() {
    if (consentStatus.personalInfo && consentStatus.healthInfo && consentStatus.thirdParty && consentStatus.program) {
        sessionStorage.setItem('consentsAgreed', 'true');
        window.location.href = 'participant.html';
    } else {
        alert('모든 항목에 동의해주세요.');
    }
}

// 페이지 로드 시
document.addEventListener('DOMContentLoaded', function() {
    // 이미 동의한 경우 체크박스 설정
    const consentsAgreed = sessionStorage.getItem('consentsAgreed');
    if (consentsAgreed === 'true') {
        document.getElementById('consentPersonalInfo').checked = true;
        document.getElementById('consentHealthInfo').checked = true;
        document.getElementById('consentThirdParty').checked = true;
        document.getElementById('consentProgram').disabled = false;
        document.getElementById('consentProgram').checked = true;
        consentStatus = { personalInfo: true, healthInfo: true, thirdParty: true, program: true };
        checkAllConsents();
    }
});
