document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('fetchButton').addEventListener('click', () => {
        
        const inputsrch = document.getElementById('x_SRCH').value;
        const apiKey = JSON.parse(localStorage.getItem("docSnap")).api;
        const characterName = encodeURIComponent(inputsrch);
        const url_id = `https://open.api.nexon.com/maplestory/v1/id?character_name=${characterName}`;

        fetch(url_id, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'x-nxopen-api-key': apiKey
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`오류: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            
            const year = yesterday.getFullYear();
            const month = String(yesterday.getMonth() + 1).padStart(2, '0');
            const day = String(yesterday.getDate()).padStart(2, '0');
            
            const formattedDate = `${year}-${month}-${day}`;

            const ocid = data.ocid;
            const srchdate = formattedDate;
            const url_basic = `https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${ocid}&date=${srchdate}`;

            fetch(url_basic, {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                    'x-nxopen-api-key': apiKey
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`오류: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                const content = document.getElementById('content');
                content.innerHTML = ''; // 이전 내용 지우기
                
                if (data.world_name != null) {
                    const infoDiv = document.createElement('div');
                    infoDiv.style.padding = '10px';
                    infoDiv.style.border = '1px solid #ddd';
                    infoDiv.style.marginBottom = '10px';
                    infoDiv.style.backgroundColor = '#f9f9f9';

                    const nameElement = document.createElement('h2');
                    nameElement.textContent = `캐릭터 이름: ${data.character_name}`;
                    infoDiv.appendChild(nameElement);

                    const worldElement = document.createElement('p');
                    worldElement.textContent = `서버 이름: ${data.world_name}`;
                    infoDiv.appendChild(worldElement);

                    const levelElement = document.createElement('p');
                    levelElement.textContent = `레벨: ${data.level}`;
                    infoDiv.appendChild(levelElement);

                    // 이미지
                    const imgElement = document.createElement('img');
                    imgElement.src = data.character_image;
                    imgElement.alt = "캐릭터 이미지";
                    imgElement.style.width = '100px';
                    imgElement.style.height = 'auto';
                    imgElement.style.display = 'block';
                    imgElement.style.marginTop = '10px';
                    infoDiv.appendChild(imgElement);

                    content.appendChild(infoDiv);
                } else {
                    const messageElement = document.createElement('p');
                    messageElement.textContent = '캐릭터가 휴면 상태입니다.';
                    content.appendChild(messageElement);
                }
            })
            .catch(error => {
                const content = document.getElementById('content');
                content.innerHTML = ''; // 이전 내용 지우기
                const errorElement = document.createElement('p');
                errorElement.textContent = error.message;
                content.appendChild(errorElement);
            });
        })
        .catch(error => {
            const content = document.getElementById('content');
            content.innerHTML = ''; // 이전 내용 지우기
            const errorElement = document.createElement('p');
            errorElement.textContent = '캐릭터가 존재하지 않습니다.';
            content.appendChild(errorElement);
            console.log(error.message);
        });
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // 폼 제출 방지
            document.getElementById('fetchButton').click();
        }
    });
});
