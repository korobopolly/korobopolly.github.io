document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('fetchButton').addEventListener('click', () => {
        
        const inputsrch     = document.getElementById('x_SRCH').value;
        const apiKey        = JSON.parse(localStorage.getItem("docSnap")).api;
        const characterName = encodeURIComponent(inputsrch); // Korean character name encoded for URL
        const url_id        = `https://open.api.nexon.com/maplestory/v1/id?character_name=${characterName}`;

        //ocid 조회
        fetch(url_id, {
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
            const responseElement       = document.createElement('p');
            responseElement.textContent = JSON.stringify(data, null, 2);
            //console.log(data.ocid);

            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            
            const year = yesterday.getFullYear();
            const month = String(yesterday.getMonth() + 1).padStart(2, '0');
            const day = String(yesterday.getDate()).padStart(2, '0');
            
            const formattedDate = `${year}-${month}-${day}`;

            const ocid      = data.ocid;
            const srchdate  = formattedDate;
            const url_basic = `https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${ocid}&date=${srchdate}`;

            //basic 조회
            fetch(url_basic, {
                method: 'GET',
                headers: {
                    'accept'          : 'application/json',
                    'x-nxopen-api-key': apiKey,
                    'ocid'            : ocid,
                    'date'            : srchdate
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                //basic 조회 (휴면 - null)
                const world_name = data.world_name;
                const responseElement       = document.createElement('pre');
                responseElement.textContent = JSON.stringify(data, null, 2);
                info.innerHTML = ''; // 이전 내용 지우기
                content.innerHTML = ''; // 이전 내용 지우기
                // document.getElementById('info').appendChild(responseElement);

                if(world_name != null){
                    const infoDiv = document.createElement('div');
                    infoDiv.style.padding = '10px';
                    infoDiv.style.border = '1px solid #ddd';
                    infoDiv.style.marginTop = '10px';
                    infoDiv.style.marginBottom = '10px';
                    infoDiv.style.backgroundColor = '#f9f9f9';
                    document.getElementById('content').appendChild(infoDiv);

                    // 이미지 URL 가져오기
                    const character_image = data.character_image;

                    // 이미지 요소 생성
                    const imgElement = document.createElement('img');
                    imgElement.src   = character_image;
                    imgElement.alt   = "MapleStory Character Image";

                    // 이미지 요소를 content 영역에 추가
                    infoDiv.appendChild(imgElement);

                    const nameElement = document.createElement('h2');
                    nameElement.textContent = `캐릭터 이름: ${data.character_name}`;
                    infoDiv.appendChild(nameElement);

                    const worldElement = document.createElement('p');
                    worldElement.textContent = `서버 이름: ${data.world_name}`;
                    infoDiv.appendChild(worldElement);

                    const levelElement = document.createElement('p');
                    levelElement.textContent = `레벨: ${data.character_level}`;
                    infoDiv.appendChild(levelElement);

                    const classElement = document.createElement('p');
                    classElement.textContent = `직업: ${data.character_class}`;
                    infoDiv.appendChild(classElement);

                    const guildElement = document.createElement('p');
                    guildElement.textContent = `길드: ${data.character_guild_name}`;
                    infoDiv.appendChild(guildElement);

                    const expElement = document.createElement('p');
                    expElement.textContent = `경험치: ${data.character_exp_rate}%`;
                    infoDiv.appendChild(expElement);

                    const dateElement = document.createElement('p');
                    dateElement.textContent = `갱신일자: ${data.date}`;
                    infoDiv.appendChild(dateElement);
                }
                //캐릭터가 휴면 상태입니다.
                else{
                    const responseElement       = document.createElement('p');
                    responseElement.textContent = '캐릭터가 휴면 상태입니다.';
                    document.getElementById('content').appendChild(responseElement);
                }
            })
            .catch(error => {
                const errorElement       = document.createElement('p');
                errorElement.textContent = error.message;
                document.getElementById('content').appendChild(errorElement);
            });
        })
        .catch(error => {
            // const errorElement       = document.createElement('p');
            // errorElement.textContent = error.message;
            // document.getElementById('content').appendChild(errorElement);
            const responseElement       = document.createElement('p');
            responseElement.textContent = '캐릭터가 존재하지않습니다.';
            document.getElementById('content').appendChild(responseElement);
            console.log(error.message);
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