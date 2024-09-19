//전역변수 - exp_array 최근 경험치 내역
var exp_array = [];

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('fetchButton').addEventListener('click', () => {
        // 전역변수 exp_array 초기화
        exp_array = [];

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
            //조회조건
            const responseElement       = document.createElement('p');
            responseElement.textContent = JSON.stringify(data, null, 2);
            //console.log(data.ocid);

            const today = new Date();
            const yesterday = new Date(today);
            //전일 데이터는 다음날 오전 2시부터 확인할 수 있습니다.
            // 오전 2시 이전이면 하루를 더 빼줍니다.
            if (today.getHours() < 2) {
                yesterday.setDate(today.getDate() - 2);
            } else {
                yesterday.setDate(today.getDate() - 1);
            }
            
            const year = yesterday.getFullYear();
            const month = String(yesterday.getMonth() + 1).padStart(2, '0');
            const day = String(yesterday.getDate()).padStart(2, '0');
            
            const formattedDate = `${year}-${month}-${day}`;

            const ocid           = data.ocid;
            const srchdate       = formattedDate;
            const url_basic      = `https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${ocid}&date=${srchdate}`;
            const url_popularity = `https://open.api.nexon.com/maplestory/v1/character/popularity?ocid=${ocid}&date=${srchdate}`;

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
                document.getElementById('info').appendChild(responseElement);

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

                    //popularity 조회
                    fetch(url_popularity, {
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
                        //popularity 조회
                        const popularityElement = document.createElement('p');
                        popularityElement.textContent = `인기도: ${data.popularity}`;
                        infoDiv.appendChild(popularityElement);

                        for(var i = 1; i<6; i++){
                            //조회조건
                            const bucket = new Date(today);
                            //전일 데이터는 다음날 오전 2시부터 확인할 수 있습니다.
                            // 오전 2시 이전이면 하루를 더 빼줍니다.
                            if (today.getHours() < 2) {
                                bucket.setDate(today.getDate() - i - 1);
                            } else {
                                bucket.setDate(today.getDate() - i);
                            }
                            
                            const year = bucket.getFullYear();
                            const month = String(bucket.getMonth() + 1).padStart(2, '0');
                            const day = String(bucket.getDate()).padStart(2, '0');
                            
                            const formattedDate = `${year}-${month}-${day}`;
                            
                            const srchdate       = formattedDate;
                            const url_basic      = `https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${ocid}&date=${srchdate}`;

                            //basic 조회 - 경험치 chart
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
                                //경험치 데이터를 받아와서 배열에 저장
                                exp_array.push({
                                    exp: data.character_exp_rate,
                                    date: data.date
                                });
                                
                                //최근 5일의 경험치 데이터가 모두 수집되면 차트 생성
                                if (exp_array.length == 5) {
                                    // 날짜를 기준으로 역순 정렬 (최신 날짜가 앞에 오도록)
                                    exp_array.sort((a, b) => new Date(b.date) - new Date(a.date));
                                    
                                     // 날짜와 경험치 데이터를 분리
                                    let dates = exp_array.map(item => {
                                        const date = new Date(item.date);

                                        // 월과 일 추출 (월은 0부터 시작하므로 +1 필요)
                                        const month = date.getMonth() + 1;
                                        const day = date.getDate();

                                        // 월/일 형식으로 변환
                                        return `${month}월 ${day}일`;
                                    });
                                    let exp_rates = exp_array.map(item => item.exp);
                                
                                    // 경험치 차트 생성
                                    new Chart(document.getElementById("line-chart"), {
                                        type: 'line',
                                        data: {
                                            labels: dates.reverse(), // 날짜는 최신 날짜가 마지막으로 오도록 순서를 반전
                                            datasets: [{ 
                                                data: exp_rates.reverse(), // 경험치도 날짜에 맞춰 반전
                                                label: "경험치",
                                                borderColor: "#3e95cd",
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
                                }
                            })
                            .catch(error => {
                                const errorElement       = document.createElement('p');
                                errorElement.textContent = error.message;
                                document.getElementById('content').appendChild(errorElement);
                            });
                        }
                    })
                    .catch(error => {
                        const errorElement       = document.createElement('p');
                        errorElement.textContent = error.message;
                        document.getElementById('content').appendChild(errorElement);
                    });
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
});

// 엔터 키를 눌렀을 때 버튼 클릭 이벤트를 트리거하는 이벤트 리스너
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // 폼 제출 방지 (입력 필드가 폼 내부에 있을 때 필요)
        document.getElementById('fetchButton').click();
    }
});