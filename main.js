document.addEventListener('DOMContentLoaded', function() {
    let myChart; // 차트 변수를 함수 외부에 선언하여 전역 접근 가능

    document.getElementById('fetchButton').addEventListener('click', () => {
        const inputsrch = document.getElementById('x_SRCH').value;
        const apiKey = JSON.parse(localStorage.getItem("docSnap")).api;
        const characterName = encodeURIComponent(inputsrch); // Korean character name encoded for URL
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
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            const today = new Date();
            const yesterday = new Date(today);
            if (today.getHours() < 2) {
                yesterday.setDate(today.getDate() - 2);
            } else {
                yesterday.setDate(today.getDate() - 1);
            }
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
                    'x-nxopen-api-key': apiKey,
                    'ocid': ocid,
                    'date': srchdate
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
                document.getElementById('info').appendChild(responseElement);

                const world_name = data.world_name;
                if (world_name != null) {
                    const character_image = data.character_image;
                    document.getElementById('content').innerHTML = ''; // 이전 내용 지우기

                    const infoDiv = document.createElement('div');
                    infoDiv.style.padding = '10px';
                    infoDiv.style.border = '1px solid #ddd';
                    infoDiv.style.marginTop = '10px';
                    infoDiv.style.marginBottom = '10px';
                    infoDiv.style.backgroundColor = '#f9f9f9';
                    document.getElementById('content').appendChild(infoDiv);

                    const imgElement = document.createElement('img');
                    imgElement.src = character_image;
                    imgElement.alt = "MapleStory Character Image";
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
                    dateElement.textContent = `갱신일자: ${srchdate}`;
                    infoDiv.appendChild(dateElement);

                    fetchExpData(ocid, apiKey, today); // 경험치 데이터를 불러오는 함수 호출
                }
            })
            .catch(error => {
                const errorElement = document.createElement('p');
                errorElement.textContent = error.message;
                document.getElementById('content').appendChild(errorElement);
            });
        })
        .catch(error => {
            const responseElement = document.createElement('p');
            responseElement.textContent = '캐릭터가 존재하지않습니다.';
            document.getElementById('content').appendChild(responseElement);
        });

        function fetchExpData(ocid, apiKey, today) {
            let exp_array = []; // exp_array 초기화

            for (let i = 1; i < 6; i++) {
                const bucket = new Date(today);
                if (today.getHours() < 2) {
                    bucket.setDate(today.getDate() - i - 1);
                } else {
                    bucket.setDate(today.getDate() - i);
                }

                const year = bucket.getFullYear();
                const month = String(bucket.getMonth() + 1).padStart(2, '0');
                const day = String(bucket.getDate()).padStart(2, '0');
                const formattedDate = `${year}-${month}-${day}`;

                const srchdate = formattedDate;
                const url_basic = `https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${ocid}&date=${srchdate}`;

                fetch(url_basic, {
                    method: 'GET',
                    headers: {
                        'accept': 'application/json',
                        'x-nxopen-api-key': apiKey,
                        'ocid': ocid,
                        'date': srchdate
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Error: ${response.status} ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    exp_array.push({
                        exp: data.character_exp_rate,
                        level: data.character_level,
                        date: data.date
                    });

                    if (exp_array.length === 5) {
                        exp_array.sort((a, b) => new Date(b.date) - new Date(a.date));

                        const dates = exp_array.map(item => {
                            const date = new Date(item.date);
                            return `${date.getMonth() + 1}월 ${date.getDate()}일`;
                        });
                        const exp_rates = exp_array.map(item => item.exp);
                        const levels = exp_array.map(item => item.level);

                        // 클릭 시마다 차트를 초기화
                        if (myChart) {
                            myChart.destroy(); // 기존 차트를 파괴하여 초기화
                        }

                        myChart = new Chart(document.getElementById("exp-chart"), {
                            type: 'line',
                            data: {
                                labels: dates.reverse(),
                                datasets: [{ 
                                    type: "line",
                                    data: exp_rates.reverse(),
                                    label: "경험치",
                                    borderColor: "#8DD28D",
                                    fill: false
                                }]
                            },
                            options: {
                                title: {
                                    display: true,
                                    text: '경험치 히스토리'
                                }
                            }
                        });

                        myChart = new Chart(document.getElementById("level-chart"), {
                            type: 'bar',
                            data: {
                                labels: dates.reverse(),
                                datasets: [{ 
                                    data: levels.reverse(),
                                    label: "레벨",
                                    backgroundColor: "#8DD28D",
                                    fill: false
                                }]
                            },
                            options: {
                                title: {
                                    display: true,
                                    text: '레벨 히스토리'
                                }
                            }
                        });
                    }
                })
                .catch(error => {
                    const errorElement = document.createElement('p');
                    errorElement.textContent = error.message;
                    document.getElementById('content').appendChild(errorElement);
                });
            }
        }
    });
});

// 엔터 키를 눌렀을 때 버튼 클릭 이벤트를 트리거하는 이벤트 리스너
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // 폼 제출 방지 (입력 필드가 폼 내부에 있을 때 필요)
        document.getElementById('fetchButton').click();
    }
});
