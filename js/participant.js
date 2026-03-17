// 참가자 정보 입력 페이지 로직

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

async function submitParticipantInfo() {
    const name = document.getElementById('participantName').value.trim();
    const birthdate = document.getElementById('participantBirthdate').value.trim();
    const gender = document.getElementById('participantGender').value;
    const phone = document.getElementById('participantPhone').value.trim();
    const address = document.getElementById('participantAddress').value.trim();
    const occupation = document.getElementById('participantOccupation').value.trim();
    const relationshipType = document.getElementById('relationshipType').value;
    const customRelationship = document.getElementById('customRelationship').value.trim();

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

    const digits = phone.replace(/\D/g, '');
    const phonePattern = /^01[0-9][0-9]{7,8}$/;
    if (!phonePattern.test(digits)) {
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

    const finalRelationship = relationshipType === '직접입력' ? customRelationship : relationshipType;

    sessionStorage.setItem('participantName', name);
    sessionStorage.setItem('participantBirthdate', birthdate);
    sessionStorage.setItem('participantGender', gender);
    sessionStorage.setItem('participantPhone', formatPhone(phone));
    sessionStorage.setItem('participantAddress', address);
    sessionStorage.setItem('participantOccupation', occupation);
    sessionStorage.setItem('participantRelationship', finalRelationship);

    window.location.href = 'selection.html';
}

document.addEventListener('DOMContentLoaded', function() {
    const consentsAgreed = sessionStorage.getItem('consentsAgreed');
    if (consentsAgreed !== 'true') {
        alert('먼저 개인정보 활용에 동의해주세요.');
        window.location.href = 'consent.html';
        return;
    }

    const savedName = sessionStorage.getItem('participantName');
    const savedBirthdate = sessionStorage.getItem('participantBirthdate');
    const savedGender = sessionStorage.getItem('participantGender');
    const savedPhone = sessionStorage.getItem('participantPhone');
    const savedAddress = sessionStorage.getItem('participantAddress');
    const savedOccupation = sessionStorage.getItem('participantOccupation');
    const savedRelationship = sessionStorage.getItem('participantRelationship');

    if (savedName) document.getElementById('participantName').value = savedName;
    if (savedBirthdate) document.getElementById('participantBirthdate').value = savedBirthdate;
    if (savedGender) document.getElementById('participantGender').value = savedGender;
    if (savedPhone) document.getElementById('participantPhone').value = savedPhone;
    if (savedAddress) document.getElementById('participantAddress').value = savedAddress;
    if (savedOccupation) document.getElementById('participantOccupation').value = savedOccupation;

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

    const phoneInput = document.getElementById('participantPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            e.target.value = formatPhone(value);
        });
    }
});
