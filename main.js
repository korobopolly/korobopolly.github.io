document.addEventListener('DOMContentLoaded', function() {
    let myChart; // 차트 변수를 전역으로 선언
    let charts = {}; // 여러 차트를 관리하기 위한 객체

    // UI 요소들
    const fetchButton = document.getElementById('fetchButton');
    const inputElement = document.getElementById('x_SRCH');
    const loadingElement = document.getElementById('loading');
    const characterSection = document.getElementById('character-section');
    const characterCard = document.getElementById('character-card');
    const errorMessage = document.getElementById('error-message');

    // 입력이 변경될 때 버튼 활성화/비활성화
    inputElement.addEventListener('input', () => {
        const hasInput = inputElement.value.trim().length > 0;
        const hasApiKey = localStorage.getItem("docSnap") && JSON.parse(localStorage.getItem("docSnap")).api;
        
        fetchButton.disabled = !hasInput || !hasApiKey;
        fetchButton.classList.toggle('opacity-50', !hasInput || !hasApiKey);
        fetchButton.classList.toggle('cursor-not-allowed', !hasInput || !hasApiKey);
    });

    // Enter 키 처리
    inputElement.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !fetchButton.disabled) {
            event.preventDefault();
            fetchButton.click();
        }
    });

    // 메인 검색 함수
    fetchButton.addEventListener('click', () => {
        const characterName = inputElement.value.trim();
        if (!characterName) return;

        // UI 상태 초기화
        hideError();
        showLoading();
        hideCharacterSection();

        const apiKey = JSON.parse(localStorage.getItem("docSnap")).api;
        const encodedCharacterName = encodeURIComponent(characterName);
        const url_id = `https://open.api.nexon.com/maplestory/v1/id?character_name=${encodedCharacterName}`;

        // 첫 번째 API 호출: 캐릭터 ID 조회
        fetch(url_id, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'x-nxopen-api-key': apiKey
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            // 캐릭터 ID가 없으면 에러
            if (!data.ocid) {
                throw new Error('Character not found');
            }

            // 캐릭터 기본 정보 조회
            return fetchCharacterBasicInfo(data.ocid, apiKey);
        })
        .then(data => {
            if (data && data.world_name) {
                displayCharacterInfo(data);
                fetchExpData(data.ocid, apiKey);
            } else {
                throw new Error('Character data not available');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError(error.message === 'Character not found' || error.message.includes('404') ? 
                '캐릭터를 찾을 수 없습니다' : 
                '데이터를 불러오는 중 오류가 발생했습니다');
        })
        .finally(() => {
            hideLoading();
        });
    });

    // 캐릭터 기본 정보 조회 함수
    function fetchCharacterBasicInfo(ocid, apiKey) {
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

        const url_basic = `https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${ocid}&date=${formattedDate}`;
        
        return fetch(url_basic, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'x-nxopen-api-key': apiKey,
                'ocid': ocid,
                'date': formattedDate
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        });
    }

    // 캐릭터 정보 표시
    function displayCharacterInfo(data) {
        const characterInfo = `
            <div class="flex flex-col lg:flex-row gap-8">
                <!-- Character Image -->
                <div class="flex-shrink-0">
                    <div class="relative group">
                        <div class="absolute -inset-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                        <img 
                            src="${data.character_image}" 
                            alt="${data.character_name} 캐릭터 이미지" 
                            class="relative w-48 h-48 object-cover rounded-2xl shadow-xl"
                            onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02NCA5NkM2NCA4MS43IDcwLjcgNzUgODQgNzVDOTcuMyA3NSAxMDQgODEuNyAxMDQgOTZIMTg4QzE4OCA5NS4yIDE5MiA4Ni44IDE5MiA3NUMxOTIgNTkuMiAxODIuOCA1MCAxNjggNTBDMTUzLjIgNTAgMTQ0IDU5LjIgMTQ0IDc1QzE0NCA4Ni44IDE0OCA5NS4yIDE0OCA5Nkg2NFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'"
                        />
                    </div>
                </div>

                <!-- Character Details -->
                <div class="flex-1">
                    <div class="flex items-start justify-between mb-6">
                        <div>
                            <h2 class="text-3xl font-bold text-slate-800 dark:text-white mb-2">
                                ${data.character_name}
                            </h2>
                            <div class="flex items-center gap-3 mb-4">
                                <span class="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold rounded-full">
                                    Lv.${data.character_level}
                                </span>
                                <span class="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold rounded-full">
                                    ${data.character_class}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div class="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-2xl">
                                <div class="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                    <i data-lucide="server" class="w-5 h-5 text-blue-500"></i>
                                </div>
                                <div>
                                    <p class="text-sm text-slate-500 dark:text-slate-400">서버</p>
                                    <p class="font-semibold text-slate-800 dark:text-white">${data.world_name}</p>
                                </div>
                            </div>

                            <div class="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-2xl">
                                <div class="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                                    <i data-lucide="users" class="w-5 h-5 text-purple-500"></i>
                                </div>
                                <div>
                                    <p class="text-sm text-slate-500 dark:text-slate-400">길드</p>
                                    <p class="font-semibold text-slate-800 dark:text-white">${data.character_guild_name || '无'}</p>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div class="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-2xl">
                                <div class="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                                    <i data-lucide="trending-up" class="w-5 h-5 text-green-500"></i>
                                </div>
                                <div>
                                    <p class="text-sm text-slate-500 dark:text-slate-400">경험치</p>
                                    <p class="font-semibold text-slate-800 dark:text-white">${data.character_exp_rate}%</p>
                                </div>
                            </div>

                            <div class="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-2xl">
                                <div class="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                                    <i data-lucide="calendar" class="w-5 h-5 text-orange-500"></i>
                                </div>
                                <div>
                                    <p class="text-sm text-slate-500 dark:text-slate-400">갱신일자</p>
                                    <p class="font-semibold text-slate-800 dark:text-white">${getCurrentSearchDate()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        characterCard.innerHTML = characterInfo;
        
        // Lucide 아이콘 초기화
        lucide.createIcons();
        
        // 캐릭터 섹션 표시
        showCharacterSection();
        
        // 부드러운 스크롤
        setTimeout(() => {
            characterSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    // 경험치 데이터 조회 및 차트 생성
    function fetchExpData(ocid, apiKey) {
        const today = new Date();
        const expData = [];

        // 5일간의 데이터를 순차적으로 조회
        const fetchPromises = [];
        
        for (let i = 1; i < 6; i++) {
            const targetDate = new Date(today);
            
            if (today.getHours() < 2) {
                targetDate.setDate(today.getDate() - i - 1);
            } else {
                targetDate.setDate(today.getDate() - i);
            }

            const year = targetDate.getFullYear();
            const month = String(targetDate.getMonth() + 1).padStart(2, '0');
            const day = String(targetDate.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;

            const url = `https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${ocid}&date=${formattedDate}`;
            
            const promise = fetch(url, {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                    'x-nxopen-api-key': apiKey,
                    'ocid': ocid,
                    'date': formattedDate
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                expData.push({
                    exp: data.character_exp_rate || 0,
                    level: data.character_level || 0,
                    date: data.date || formattedDate
                });
            })
            .catch(error => {
                console.error(`Error fetching data for ${formattedDate}:`, error);
                // 에러가 발생한 날짜에도 기본 데이터 추가
                expData.push({
                    exp: 0,
                    level: 0,
                    date: formattedDate
                });
            });

            fetchPromises.push(promise);
        }

        // 모든 데이터 조회가 완료되면 차트 생성
        Promise.all(fetchPromises).then(() => {
            // 날짜 순으로 정렬 (최신순)
            expData.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            if (expData.length > 0) {
                createCharts(expData);
            }
        });
    }

    // 차트 생성 함수
    function createCharts(data) {
        const dates = data.map(item => {
            const date = new Date(item.date);
            return `${date.getMonth() + 1}월 ${date.getDate()}일`;
        }).reverse();
        
        const expRates = data.map(item => item.exp).reverse();
        const levels = data.map(item => item.level).reverse();

        // 다크 모드 확인
        const isDark = document.documentElement.classList.contains('dark');
        const textColor = isDark ? '#e2e8f0' : '#1e293b';
        const gridColor = isDark ? '#334155' : '#e2e8f0';
        const backgroundColor = isDark ? '#1e293b' : '#ffffff';

        // 기존 차트 제거
        Object.values(charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        charts = {};

        // 경험치 차트
        const expCtx = document.getElementById("exp-chart").getContext('2d');
        charts.exp = new Chart(expCtx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: '경험치 (%)',
                    data: expRates,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: backgroundColor,
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: gridColor,
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: gridColor,
                            drawBorder: false
                        },
                        ticks: {
                            color: textColor
                        }
                    },
                    y: {
                        grid: {
                            color: gridColor,
                            drawBorder: false
                        },
                        ticks: {
                            color: textColor,
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });

        // 레벨 차트
        const levelCtx = document.getElementById("level-chart").getContext('2d');
        charts.level = new Chart(levelCtx, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [{
                    label: '레벨',
                    data: levels,
                    backgroundColor: '#3b82f6',
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: gridColor,
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: textColor
                        }
                    },
                    y: {
                        grid: {
                            color: gridColor,
                            drawBorder: false
                        },
                        ticks: {
                            color: textColor
                        }
                    }
                }
            }
        });
    }

    // UI 헬퍼 함수들
    function showLoading() {
        loadingElement.classList.remove('hidden');
        fetchButton.disabled = true;
    }

    function hideLoading() {
        loadingElement.classList.add('hidden');
        const hasInput = inputElement.value.trim().length > 0;
        const hasApiKey = localStorage.getItem("docSnap") && JSON.parse(localStorage.getItem("docSnap")).api;
        fetchButton.disabled = !hasInput || !hasApiKey;
    }

    function showCharacterSection() {
        characterSection.classList.remove('hidden');
    }

    function hideCharacterSection() {
        characterSection.classList.add('hidden');
    }

    function showError(message) {
        const errorText = errorMessage.querySelector('p');
        const errorSubtext = errorMessage.querySelector('.text-sm');
        
        if (message === '캐릭터를 찾을 수 없습니다') {
            errorText.textContent = '캐릭터를 찾을 수 없습니다';
            errorSubtext.textContent = '캐릭터명이 올바른지 확인해주세요';
        } else {
            errorText.textContent = '데이터를 불러오는 중 오류가 발생했습니다';
            errorSubtext.textContent = '잠시 후 다시 시도해주세요';
        }
        
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
    }

    function getCurrentSearchDate() {
        const today = new Date();
        const yesterday = new Date(today);
        
        if (today.getHours() < 2) {
            yesterday.setDate(today.getDate() - 2);
        } else {
            yesterday.setDate(today.getDate() - 1);
        }
        
        return yesterday.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // 다크 모드 변경 시 차트 업데이트
    const themeObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const isDark = document.documentElement.classList.contains('dark');
                if (isDark && characterSection && !characterSection.classList.contains('hidden')) {
                    // 차트가 존재하면 재생성
                    const data = JSON.parse(localStorage.getItem('currentCharacterData'));
                    if (data && data.length > 0) {
                        createCharts(data);
                    }
                }
            }
        });
    });

    themeObserver.observe(document.documentElement, {
        attributes: true
    });
});