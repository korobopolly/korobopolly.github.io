document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('fetchButton').addEventListener('click', () => {
        
        const inputsrch     = document.getElementById('x_SRCH').value;
        const apiKey        = JSON.parse(localStorage.getItem("docSnap")).api;
        const characterName = encodeURIComponent(inputsrch); // Korean character name encoded for URL
        const url           = `https://open.api.nexon.com/maplestory/v1/id?character_name=${characterName}`;

        fetch(url, {
            method: 'GET',
            headers: {
                'accept'          : 'application/json',
                'x-nxopen-api-key': apiKey
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            const responseElement       = document.createElement('pre');
            responseElement.textContent = JSON.stringify(data, null, 2);
            //console.log(data.ocid);
            document.body.appendChild(responseElement);
        })
        .catch(error => {
            const errorElement       = document.createElement('pre');
            errorElement.textContent = error.message;
            document.body.appendChild(errorElement);
        });
    });

    // 엔터 키를 눌렀을 때 버튼 클릭 이벤트를 트리거하는 이벤트 리스너
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // 폼 제출 방지 (입력 필드가 폼 내부에 있을 때 필요)
            document.getElementById('fetchButton').click();
        }
    });
});