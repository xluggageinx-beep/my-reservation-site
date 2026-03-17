// 참가자 정보 입력 페이지 로직

// 관계 선택 변경 시
function handleRelationshipChange() {
    const relationshipType = document.getElementById('relationshipType').value;
    const customGroup = document.getElementById('customRelationshipGroup');
    const customInput = document.getElementById('customRelationship');
    
    if (relationshipType === '직접입력') {
        customGroup.style.display = 'block';
        customInput.required = true;
    } else {
        customGroup.style.display = 'none';
        customInput.required = false;
        customInput.value = '';
    }
}

// 참가자 정보 제출
async function submitParticipantInfo() {
    const name = document.getElementById('participantName').value.trim();
    const birthdate = document.getElementById('participantBirthdate').value.trim();
    const gender = document.getElementById('participantGender').value;
    const phone = document.getElementById('participantPhone').value.trim();
    const address = document.getElementById('participantAddress').value.trim();
    const occupation = document.getElementById('participantOccupation').value.trim();
    const relationshipType = document.getElementById('relationshipType').value;
    const customRelationship = document.getElementById('customRelationship').value.trim();
    
    // 유효성 검사
    if (!name) {
        alert('이름을 입력해주세요.');
        return;
    }
    
    if (!birthdate) {
        alert('생년월일을 선택해주세요.');
        return;
    }
    
    if (!gender) {
        alert('성별을 선택해주세요.');
        return;
    }
    
    if (!phone) {
        alert('전화번호를 입력해주세요.');
        return;
    }
    
    // 전화번호 형식 검사
    const phonePattern = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!phonePattern.test(phone.replace(/-/g, ''))) {
        alert('올바른 전화번호 형식이 아닙니다. (예: 010-0000-0000)');
        return;
    }
    
    if (!address) {
        alert('주소를 입력해주세요.');
        return;
    }
    
    if (!occupation) {
        alert('직업을 입력해주세요.');
        return;
    }
    
    if (!relationshipType) {
        alert('술자와의 관계를 선택해주세요.');
        return;
    }
    
    if (relationshipType === '직접입력' && !customRelationship) {
        alert('관계를 직접 입력해주세요.');
        return;
    }
    
    // 최종 관계 값 결정
    const finalRelationship = relationshipType === '직접입력' ? customRelationship : relationshipType;
    
    // 세션 스토리지에 저장
    sessionStorage.setItem('participantName', name);
    sessionStorage.setItem('participantBirthdate', birthdate);
    sessionStorage.setItem('participantGender', gender);
    sessionStorage.setItem('participantPhone', formatPhone(phone));
    sessionStorage.setItem('participantAddress', address);
    sessionStorage.setItem('participantOccupation', occupation);
    sessionStorage.setItem('participantRelationship', finalRelationship);
    
    // 다음 페이지로 이동
    window.location.href = 'selection.html';
}

// 페이지 로드 시
document.addEventListener('DOMContentLoaded', function() {
    // 동의 확인
    const consentsAgreed = sessionStorage.getItem('consentsAgreed');
    if (consentsAgreed !== 'true') {
        alert('먼저 개인정보 활용에 동의해주세요.');
        window.location.href = 'consent.html';
        return;
    }
    
    // 이전에 입력한 정보가 있으면 자동 입력
    const savedName = sessionStorage.getItem('participantName');
    const savedBirthdate = sessionStorage.getItem('participantBirthdate');
    const savedGender = sessionStorage.getItem('participantGender');
    const savedPhone = sessionStorage.getItem('participantPhone');
    const savedAddress = sessionStorage.getItem('participantAddress');
    const savedOccupation = sessionStorage.getItem('participantOccupation');
    const savedRelationship = sessionStorage.getItem('participantRelationship');
    
    if (savedName) {
        document.getElementById('participantName').value = savedName;
    }
    if (savedBirthdate) {
        document.getElementById('participantBirthdate').value = savedBirthdate;
    }
    if (savedGender) {
        document.getElementById('participantGender').value = savedGender;
    }
    if (savedPhone) {
        document.getElementById('participantPhone').value = savedPhone;
    }
    if (savedAddress) {
        document.getElementById('participantAddress').value = savedAddress;
    }
    if (savedOccupation) {
        document.getElementById('participantOccupation').value = savedOccupation;
    }
    if (savedRelationship) {
        const relationshipType = document.getElementById('relationshipType');
        const options = Array.from(relationshipType.options).map(opt => opt.value);
        
        if (options.includes(savedRelationship)) {
            relationshipType.value = savedRelationship;
        } else {
            relationshipType.value = '직접입력';
            document.getElementById('customRelationship').value = savedRelationship;
            handleRelationshipChange();
        }
    }
    
    // 전화번호 자동 포맷팅
    const phoneInput = document.getElementById('participantPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) {
                value = value.slice(0, 11);
            }
            e.target.value = formatPhone(value);
        });
    }
});
