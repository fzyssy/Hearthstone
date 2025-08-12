// 联机对战按钮逻辑（WebSocket接入）
// 简化的房间状态显示
function updateRoomStatus(players = [], currentTurn = '') {
    let logWin = document.getElementById('online-log-window');
    if (!logWin) {
        logWin = document.createElement('div');
        logWin.id = 'online-log-window';
        logWin.style.position = 'fixed';
        logWin.style.left = '20px';
        logWin.style.bottom = '20px';
        logWin.style.width = '300px';
        logWin.style.height = '60px'; // 固定高度，只显示两行
        logWin.style.overflow = 'hidden'; // 隐藏溢出内容
        logWin.style.background = 'rgba(255,255,255,0.95)';
        logWin.style.border = '1px solid #bbb';
        logWin.style.borderRadius = '8px';
        logWin.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
        logWin.style.fontSize = '13px';
        logWin.style.color = '#222';
        logWin.style.padding = '8px 12px';
        logWin.style.zIndex = '9999';
        logWin.style.lineHeight = '1.4';
        document.body.appendChild(logWin);
    }

    // 更新内容，只显示两行
    let playersText = players.length > 0 ? `房间玩家: ${players.join(', ')}` : '等待玩家加入...';
    let turnText = currentTurn ? `轮到: ${currentTurn}` : '等待游戏开始';

    logWin.innerHTML = `
        <div style="margin-bottom: 2px;"><b>${playersText}</b></div>
        <div style="color: #4a90e2;"><b>${turnText}</b></div>
    `;
}

// 保留原有的appendLog函数，但改为调用updateRoomStatus（用于向后兼容）
function appendLog(msg) {
    // 这个函数现在什么都不做，所有状态更新都通过updateRoomStatus处理
}

document.addEventListener('DOMContentLoaded', function () {
    var onlineBtn = document.getElementById('online-battle');
    if (onlineBtn) {
        let wsConnected = false;
        onlineBtn.onclick = function () {
            if (wsConnected) return; // 已连接则不再响应
            let userId = prompt('请输入你的ID');
            if (!userId) {
                alert('ID不能为空');
                return;
            }
            myUserId = userId;
            ws = new window.WebSocket('ws://112.124.29.249:3001');
            window._onlineWS = ws; // 方便调试
            onlineBtn.disabled = true; // 禁用按钮
            wsConnected = true;
            // 初始化房间状态显示
            updateRoomStatus([], '连接中...');
            ws.onopen = function () {
                ws.send(JSON.stringify({ type: 'join', userId }));
            };
            ws.onmessage = function (event) {
                let data;
                try { data = JSON.parse(event.data); } catch { return; }
                if (data.type === 'error') {
                    alert('联机失败：' + data.msg);
                    ws.close();
                } else if (data.type === 'system') {
                    showOnlineMsg(data.msg);
                    // 更新房间玩家列表
                    if (data.players) {
                        roomPlayers = data.players;
                        updateRoomStatus(roomPlayers, currentTurnPlayer);
                    }
                } else if (data.type === 'turn') {
                    isMyTurn = (data.userId === myUserId);
                    currentTurnPlayer = data.userId;
                    updateInputState();
                    updateRoomStatus(roomPlayers, currentTurnPlayer);

                    if (isMyTurn) {
                        showOnlineMsg('轮到你猜卡牌！');
                    } else {
                        showOnlineMsg('轮到 ' + data.userId + ' 猜卡牌');
                    }
                } else if (data.type === 'guess') {
                    if (data.cardId && data.cardName) {
                        // 只显示其他玩家的猜测，自己的猜测已经在confirmCard中显示了
                        if (data.userId !== myUserId) {
                            fillCardTable({ id: data.cardId, name: data.cardName }, data.userId);
                            showOnlineMsg(data.userId + ' 猜了：' + data.cardName);
                        }

                        // 检查是否猜中
                        if (currentCard && data.cardName === currentCard.name) {
                            setTimeout(() => {
                                if (data.userId !== myUserId) {
                                    showCongrats();
                                    showOnlineMsg(`🎉 ${data.userId} 猜中了！`);
                                }
                            }, 500);
                        }
                    } else {
                        showOnlineMsg(data.userId + ' 猜了：' + data.guess);
                    }
                } else if (data.type === 'gameStart') {
                    showOnlineMsg('游戏开始！大家开始猜卡牌吧！');
                    // 开始新游戏
                    startNewGameOnline();
                }
            };
            ws.onclose = function () {
                showOnlineMsg('已断开与服务器的连接');
                onlineBtn.disabled = false; // 断开后可重新点击
                wsConnected = false;
                // 清空房间状态
                roomPlayers = [];
                currentTurnPlayer = '';
                updateRoomStatus([], '');
            };
        };
    }
});

// 联机游戏开始
function startNewGameOnline() {
    // 在联机模式下开始新游戏
    startNewGame();
    // 清空表格，准备接收共享数据
    document.getElementById('card-table-body').innerHTML = '';
    showOnlineMsg('所有人猜同一张卡牌！');
}

// 更新共享表格，显示所有玩家的猜测
function updateSharedTable(guesses) {
    const tbody = document.getElementById('card-table-body');

    // 遍历所有猜测记录，更新表格
    guesses.forEach(guess => {
        const card = allMinionCards.find(c => c.id === guess.cardId);
        if (card) {
            fillCardTable(card, guess.userId);
        }
    });
}


// 控制输入和确认按钮可用性
function updateInputState() {
    const input = document.getElementById('guess-input');
    const resultsContainer = document.getElementById('search-results');
    if (!input) return;
    input.disabled = !isMyTurn;
    // 禁用所有确认按钮
    if (resultsContainer) {
        resultsContainer.querySelectorAll('button').forEach(btn => {
            if (btn.textContent.includes('确认')) {
                btn.disabled = !isMyTurn;
            }
        });
    }
}

// 联机对战消息显示
function showOnlineMsg(msg) {
    let container = document.getElementById('online-msg-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'online-msg-container';
        container.style.position = 'fixed';
        container.style.right = '20px';
        container.style.top = '20px';
        container.style.background = 'rgba(0,0,0,0.7)';
        container.style.color = '#fff';
        container.style.padding = '14px 22px';
        container.style.borderRadius = '8px';
        container.style.zIndex = '9999';
        container.style.fontSize = '16px';
        document.body.appendChild(container);
    }
    container.textContent = msg;
    container.style.display = 'block';
    clearTimeout(container._hideTimer);
    container._hideTimer = setTimeout(() => { container.style.display = 'none'; }, 4000);
}
// =====================
// 图片缓存Map
const imgCache = new Map();
// 炉石猜卡牌主逻辑入口
// =====================

document.getElementById('start-game').onclick = function () {
    // 新游戏按钮，重置表格并开始新一轮
    startNewGame();
    document.getElementById('card-table-body').innerHTML = '';
};

let currentCard = null;
// 当前选中卡牌和全部随从卡牌
let myUserId = null;
let allMinionCards = [];
let ws = null;
let isMyTurn = false;

// 房间状态
let roomPlayers = [];
let currentTurnPlayer = '';

// 当前筛选条件
let selectedSets = [];
let selectedRarities = [];

function startNewGame() {
    // 随机选择一张随从卡牌，重置界面

    allMinionCards = window.hsCards.filter(card => card.type === 'MINION' && card.name);

    // 应用筛选条件
    let filtered = allMinionCards;
    if (selectedSets.length > 0) {
        filtered = filtered.filter(card => selectedSets.includes(card.set));
    }
    if (selectedRarities.length > 0) {
        filtered = filtered.filter(card => selectedRarities.includes(card.rarity));
    }
    if (filtered.length === 0) {
        alert('没有找到符合筛选条件的随从卡牌');
        return;
    }
    allMinionCards = filtered;


    const randomIndex = Math.floor(Math.random() * allMinionCards.length);
    currentCard = allMinionCards[randomIndex];

    console.log('当前选中的卡牌：', currentCard.name);

    document.getElementById('game-interface').style.display = 'block';
    document.getElementById('answer-display').style.display = 'none';
    document.getElementById('guess-input').value = '';
    document.getElementById('search-results').innerHTML = '';


    setupInputEvents();
}


function setupInputEvents() {
    // 绑定输入框事件，处理搜索和结果展示
    const input = document.getElementById('guess-input');
    const resultsContainer = document.getElementById('search-results');

    input.oninput = function (e) {
        const query = e.target.value.trim();
        if (query === '') {
            resultsContainer.innerHTML = '';
            return;
        }

        // 应用筛选条件
        let filtered = allMinionCards;
        if (selectedSets.length > 0) {
            filtered = filtered.filter(card => selectedSets.includes(card.set));
        }
        if (selectedRarities.length > 0) {
            filtered = filtered.filter(card => selectedRarities.includes(card.rarity));
        }

        const matchingCards = filtered.filter(card =>
            card.name && card.name.includes(query)
        );

        if (matchingCards.length === 0) {
            resultsContainer.innerHTML = '<div style="padding:10px; color:#999;">没有找到匹配的卡牌</div>';
        } else {
            matchingCards.sort((a, b) => (a.cost || 0) - (b.cost || 0));
            let resultsHtml = '';
            matchingCards.forEach(card => {
                resultsHtml += `
                    <div class="card-result" 
                         style="padding:8px 12px; border-bottom:1px solid #eee; transition:background 0.2s; display:flex; justify-content:space-between; align-items:center;"
                         onmouseover="this.style.background='#f0f0f0'" 
                         onmouseout="this.style.background='transparent'">
                        <span style="flex:1;">${card.name}</span>
                        <button data-card-id="${card.id}" data-card-name="${card.name}" class="preview-btn"
                                style="background:#4a90e2; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer; margin-left:8px;">
                            预览
                        </button>
                        <button onclick="confirmCard('${card.id}')" 
                                style="background:#27ae60; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer; margin-left:6px;">
                            确认
                        </button>
                    </div>
                `;
            });
            resultsContainer.innerHTML = resultsHtml;

            // 使用事件委托处理预览按钮点击
            resultsContainer.querySelectorAll('.preview-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const cardId = this.getAttribute('data-card-id');
                    const cardName = this.getAttribute('data-card-name');
                    previewCard(cardId, cardName);
                });
            });
        }
    };

}


function confirmCard(cardId) {
    // 用户确认选择卡牌，填入表格
    const card = allMinionCards.find(c => c.id === cardId);
    if (!card) return;

    // 如果是联机模式，发送猜测到服务器
    if (ws && ws.readyState === WebSocket.OPEN && myUserId) {
        ws.send(JSON.stringify({
            type: 'guess',
            userId: myUserId,
            cardId: card.id,
            cardName: card.name
        }));
        // 在联机模式下，也要本地显示自己的猜测
        fillCardTable(card, myUserId);

        // 检查是否猜中
        if (currentCard && card.name === currentCard.name) {
            setTimeout(() => {
                showCongrats();
                showOnlineMsg(`🎉 你猜中了！`);
            }, 500);
        }
    } else {
        // 单机模式
        fillCardTable(card);
        // 无论何时，只要猜中就弹窗
        if (currentCard && card.name === currentCard.name) {
            showCongrats();
        }
    }
}


function fillCardTable(card, guesser = null) {
    // 填充右侧表格，使用翻译框架
    const tbody = document.getElementById('card-table-body');
    // 只提取<b>标签内容为关键词
    let keywordSet = new Set();
    if (typeof card.text === 'string') {
        // 使用 [\s\S] 来匹配包括换行符在内的所有字符
        const boldMatches = card.text.match(/<b>([\s\S]*?)<\/b>/g);
        if (boldMatches) {
            boldMatches.forEach(boldTag => {
                const content = boldTag.replace(/<b>|<\/b>/g, '').replace(/：|:/g, '').trim();
                // 按逗号、换行符等分隔符分割关键词
                const keywords = content.split(/[，,、\n\r]+/).map(kw => kw.trim()).filter(kw => kw);
                keywords.forEach(kw => {
                    if (kw) keywordSet.add(kw);
                });
            });
        }
    }
    const keywordArr = Array.from(keywordSet);
    let mechanicsStr = keywordArr.join('，');
    // 对比答案卡牌
    const answer = currentCard;
    let answerKeywordSet = new Set();
    if (answer && typeof answer.text === 'string') {
        // 使用 [\s\S] 来匹配包括换行符在内的所有字符
        const boldMatches = answer.text.match(/<b>([\s\S]*?)<\/b>/g);
        if (boldMatches) {
            boldMatches.forEach(boldTag => {
                const content = boldTag.replace(/<b>|<\/b>/g, '').replace(/：|:/g, '').trim();
                // 按逗号、换行符等分隔符分割关键词
                const keywords = content.split(/[，,、\n\r]+/).map(kw => kw.trim()).filter(kw => kw);
                keywords.forEach(kw => {
                    if (kw) answerKeywordSet.add(kw);
                });
            });
        }
    }
    const answerKeywordArr = Array.from(answerKeywordSet);
    let answerMechanicsStr = answerKeywordArr.join('，');
    function highlight(same) {
        return same ? 'background:#d0f5e8;font-weight:bold;' : '';
    }
    // 黄色底提示：部分正确
    function partialHint(partial) {
        return partial ? 'background:#ffe066;' : '';
    }

    // 判断集合部分重合但不完全相等
    function isPartialMatch(userSet, answerSet) {
        if (!userSet || !answerSet) return false;
        const set1 = new Set(userSet), set2 = new Set(answerSet);
        const intersection = [...set1].filter(x => set2.has(x));
        return intersection.length > 0 && (set1.size !== set2.size || intersection.length !== set1.size);
    }
    // 数值区间提示
    function numberHint(user, ans) {
        if (user === ans) return '';
        if (user < ans) return '<span style="color:#27ae60;font-size:12px;">↑</span>';
        if (user > ans) return '<span style="color:#e74c3c;font-size:12px;">↓</span>';
        return '';
    }
    // 接近区间高亮
    function nearRange(user, ans) {
        if (user === ans) return highlight(true);
        if (Math.abs(user - ans) <= 3) return 'background:#ffe066;';
        return '';
    }
    // 支持多种族显示
    let raceStr = '';
    let userRaces = Array.isArray(card.races) ? card.races : (card.race ? [card.race] : []);
    let answerRaces = Array.isArray(answer.races) ? answer.races : (answer.race ? [answer.race] : []);
    // 处理无种族（NONE）情况，统一用空数组表示
    if (userRaces.length === 1 && (userRaces[0] === 'NONE' || userRaces[0] === '')) userRaces = [];
    if (answerRaces.length === 1 && (answerRaces[0] === 'NONE' || answerRaces[0] === '')) answerRaces = [];
    if (userRaces.length > 0) {
        raceStr = userRaces.map(r => window.HSTranslator.translate('race', r)).join(',');
    }
    // 支持双职业显示
    function getClassStr(c) {
        if (Array.isArray(c.classes) && c.classes.length > 0) {
            return c.classes.map(cls => window.HSTranslator.translate('class', cls)).join(',');
        } else if (c.cardClass) {
            return window.HSTranslator.translate('class', c.cardClass);
        } else {
            return '';
        }
    }
    // 职业部分正确判断
    function classHighlight(card, answer) {
        // 获取职业数组
        let userClasses = Array.isArray(card.classes) ? card.classes : (card.cardClass ? [card.cardClass] : []);
        let answerClasses = Array.isArray(answer.classes) ? answer.classes : (answer.cardClass ? [answer.cardClass] : []);
        if (userClasses.length > 0 && answerClasses.length > 0) {
            if (userClasses.length === answerClasses.length && userClasses.every((v, i) => v === answerClasses[i])) {
                return highlight(true);
            } else if (isPartialMatch(userClasses, answerClasses)) {
                return partialHint(true);
            }
        }
        return '';
    }
    // 获取拓展包顺序
    const setOrder = [
        'VANILLA', 'NAXX', 'GVG', 'BRM', 'TGT', 'LOE', 'OG', 'KARA', 'GANGS', 'UNGORO', 'ICECROWN', 'LOOTAPALOOZA', 'GILNEAS', 'BOOMSDAY', 'TROLL', 'DALARAN', 'ULDUM', 'DRAGONS', 'YEAR_OF_THE_DRAGON', 'DEMON_HUNTER_INITIATE', 'BLACK_TEMPLE', 'SCHOLOMANCE', 'DARKMOON_FAIRE', 'THE_BARRENS', 'STORMWIND', 'ALTERAC_VALLEY', 'THE_SUNKEN_CITY', 'REVENDRETH', 'PATH_OF_ARTHAS', 'RETURN_OF_THE_LICH_KING', 'WONDERS', 'BATTLE_OF_THE_BANDS', 'TITANS', 'WILD_WEST', 'CORE', 'EVENT', 'WHIZBANGS_WORKSHOP', 'ISLAND_VACATION', 'SPACE', 'EMERALD_DREAM', 'THE_LOST_CITY'
    ];
    function setNearRange(userSet, ansSet) {
        if (userSet === ansSet) return highlight(true);
        const idx1 = setOrder.indexOf(userSet);
        const idx2 = setOrder.indexOf(ansSet);
        if (idx1 !== -1 && idx2 !== -1 && Math.abs(idx1 - idx2) <= 3) return 'background:#ffe066;';
        return '';
    }
    // 拓展包箭头提示
    function setArrow(userSet, ansSet) {
        if (userSet === ansSet) return '';
        const idx1 = setOrder.indexOf(userSet);
        const idx2 = setOrder.indexOf(ansSet);
        if (idx1 === -1 || idx2 === -1) return '';
        if (idx1 < idx2) return '<span style="color:#27ae60;font-size:12px;">↑</span>';
        if (idx1 > idx2) return '<span style="color:#e74c3c;font-size:12px;">↓</span>';
        return '';
    }
    // 关键词部分正确判断
    let mechanicsCellStyle = '';
    if (mechanicsStr === answerMechanicsStr) {
        mechanicsCellStyle = highlight(true);
    } else if (isPartialMatch(keywordArr, answerKeywordArr)) {
        mechanicsCellStyle = partialHint(true);
    }
    // 种族部分正确判断
    let raceCellStyle = '';
    // 两者都无种族时也应高亮
    if (userRaces.length === 0 && answerRaces.length === 0) {
        raceCellStyle = highlight(true);
    } else if (userRaces.length > 0 && answerRaces.length > 0) {
        if (userRaces.length === answerRaces.length && userRaces.every((v, i) => v === answerRaces[i])) {
            raceCellStyle = highlight(true);
        } else if (isPartialMatch(userRaces, answerRaces)) {
            raceCellStyle = partialHint(true);
        }
    }
    tbody.innerHTML += `
        <tr>
            <td style="padding:6px 8px; text-align:center;${highlight(card.name === answer.name)}">${card.name}${guesser ? `<br><small style="color:#666;">(${guesser})</small>` : ''}</td>
            <td style="padding:6px 8px; text-align:center;${highlight(card.type === answer.type)}">${window.HSTranslator.translate('type', card.type)}</td>
            <td style="padding:6px 8px; text-align:center;${highlight(card.rarity === answer.rarity)}">${window.HSTranslator.translate('rarity', card.rarity)}</td>
            <td style="padding:6px 8px; text-align:center;${classHighlight(card, answer)}">${getClassStr(card)}</td>
            <td style="padding:6px 8px; text-align:center;${nearRange(card.cost, answer.cost)}">${card.cost || 0} ${numberHint(card.cost, answer.cost)}</td>
            <td style="padding:6px 8px; text-align:center;${nearRange(card.attack, answer.attack)}">${card.attack || 0} ${numberHint(card.attack, answer.attack)}</td>
            <td style="padding:6px 8px; text-align:center;${nearRange(card.health, answer.health)}">${card.health || 0} ${numberHint(card.health, answer.health)}</td>
            <td style="padding:6px 8px; text-align:center;${mechanicsCellStyle}">${mechanicsStr}</td>
            <td style="padding:6px 8px; text-align:center;${raceCellStyle}">${raceStr}</td>
            <td style="padding:6px 8px; text-align:center;${setNearRange(card.set, answer.set)}">${window.HSTranslator.translate('set', card.set)} ${setArrow(card.set, answer.set)}</td>
        </tr>
    `;
}

function showCongrats() {
    // 猜中卡牌时弹窗提示
    alert('恭喜你，猜中了！');
}


function previewCard(cardId, cardName) {
    // 预览卡牌图片
    const imgUrl = `https://art.hearthstonejson.com/v1/render/latest/zhCN/256x/${cardId}.png`;
    const fallbackUrl = `https://art.hearthstonejson.com/v1/render/latest/enUS/256x/${cardId}.png`;
    const container = document.getElementById('preview-img-container');

    // 只更新img，不每次重建DOM
    let img = container.querySelector('img');
    let nameDiv = container.querySelector('.preview-card-name');
    if (!img) {
        img = document.createElement('img');
        img.style.maxWidth = '180px';
        img.style.borderRadius = '8px';
        img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        container.innerHTML = '';
        container.appendChild(img);
        // 卡牌名
        nameDiv = document.createElement('div');
        nameDiv.className = 'preview-card-name';
        nameDiv.style.fontSize = '13px';
        nameDiv.style.color = '#333';
        nameDiv.style.marginTop = '6px';
        nameDiv.textContent = cardName;
        container.appendChild(nameDiv);
    } else {
        // 更新卡牌名
        if (!nameDiv) {
            nameDiv = document.createElement('div');
            nameDiv.className = 'preview-card-name';
            nameDiv.style.fontSize = '13px';
            nameDiv.style.color = '#333';
            nameDiv.style.marginTop = '6px';
            container.appendChild(nameDiv);
        }
        nameDiv.textContent = cardName;
    }
    // 先显示加载提示
    img.style.display = 'none';
    if (container.querySelector('.loading') === null) {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.style.width = '180px';
        loadingDiv.style.height = '250px';
        loadingDiv.style.background = '#f8f8f8';
        loadingDiv.style.borderRadius = '8px';
        loadingDiv.style.display = 'flex';
        loadingDiv.style.alignItems = 'center';
        loadingDiv.style.justifyContent = 'center';
        loadingDiv.style.color = '#666';
        loadingDiv.style.fontSize = '14px';
        loadingDiv.textContent = '加载中...';
        container.insertBefore(loadingDiv, img);
    } else {
        container.querySelector('.loading').style.display = 'flex';
    }

    // 优先用缓存
    if (imgCache.has(imgUrl)) {
        img.src = imgUrl;
        img.onload = function () {
            img.style.display = '';
            const loadingDiv = container.querySelector('.loading');
            if (loadingDiv) loadingDiv.style.display = 'none';
        };
        img.onerror = function () {
            // 尝试备用
            if (imgCache.has(fallbackUrl)) {
                img.src = fallbackUrl;
            } else {
                img.style.display = 'none';
                const loadingDiv = container.querySelector('.loading');
                if (loadingDiv) {
                    loadingDiv.textContent = '图片加载失败';
                    loadingDiv.style.color = '#999';
                    loadingDiv.style.background = '#f0f0f0';
                }
            }
        };
        return;
    }

    // 预加载主图
    const preloadImg = new window.Image();
    preloadImg.onload = function () {
        imgCache.set(imgUrl, true);
        img.src = imgUrl;
        img.style.display = '';
        const loadingDiv = container.querySelector('.loading');
        if (loadingDiv) loadingDiv.style.display = 'none';
    };
    preloadImg.onerror = function () {
        // 预加载备用
        const fallbackImg = new window.Image();
        fallbackImg.onload = function () {
            imgCache.set(fallbackUrl, true);
            img.src = fallbackUrl;
            img.style.display = '';
            const loadingDiv = container.querySelector('.loading');
            if (loadingDiv) loadingDiv.style.display = 'none';
        };
        fallbackImg.onerror = function () {
            img.style.display = 'none';
            const loadingDiv = container.querySelector('.loading');
            if (loadingDiv) {
                loadingDiv.textContent = '图片加载失败';
                loadingDiv.style.color = '#999';
                loadingDiv.style.background = '#f0f0f0';
            }
        };
        fallbackImg.src = fallbackUrl;
    };
    preloadImg.src = imgUrl;
}
// 悬停预加载图片
document.addEventListener('mouseover', function (e) {
    if (e.target && e.target.classList && e.target.classList.contains('preview-btn')) {
        const cardId = e.target.getAttribute('data-card-id');
        if (!cardId) return;
        const imgUrl = `https://art.hearthstonejson.com/v1/render/latest/zhCN/256x/${cardId}.png`;
        if (!imgCache.has(imgUrl)) {
            const preloadImg = new window.Image();
            preloadImg.onload = function () { imgCache.set(imgUrl, true); };
            preloadImg.src = imgUrl;
        }
    }
});

async function loadHearthstoneCards() {
    // 加载炉石卡牌API数据
    try {
        const response = await fetch('https://api.hearthstonejson.com/v1/latest/zhCN/cards.collectible.json');
        if (!response.ok) throw new Error('网络错误');
        let cards = await response.json();
        // 过滤掉拓展包为“PLACEHOLDER_202204”、“EXPERT1”或“LEGACY”的卡牌
        cards = cards.filter(card => card.set !== 'PLACEHOLDER_202204' && card.set !== 'EXPERT1' && card.set !== 'LEGACY');
        console.log('卡牌数据加载成功（已过滤PLACEHOLDER_202204、EXPERT1和LEGACY），共', cards.length, '张卡牌');
        window.hsCards = cards;
        startNewGame();
    } catch (e) {
        console.error('卡牌数据加载失败', e);
        alert('卡牌数据加载失败，请检查网络连接后刷新页面');
    }
}

window.addEventListener('DOMContentLoaded', loadHearthstoneCards);
// 页面加载时自动拉取卡牌数据
// 显示答案按钮功能
document.addEventListener('DOMContentLoaded', function () {
    // 筛选拓展包
    var filterSetBtn = document.getElementById('filter-expansion');
    if (filterSetBtn) {
        filterSetBtn.onclick = function () {
            showMultiSelectDialog('选择拓展包', getAllSets(), selectedSets, function (newSelected) {
                selectedSets = newSelected;
                // 只设置条件，不自动开始新游戏
            });
        };
    }
    // 筛选稀有度
    var filterRarityBtn = document.getElementById('filter-rarity');
    if (filterRarityBtn) {
        filterRarityBtn.onclick = function () {
            showMultiSelectDialog('选择稀有度', getAllRarities(), selectedRarities, function (newSelected) {
                selectedRarities = newSelected;
                // 只设置条件，不自动开始新游戏
            });
        };
    }
    // 显示答案
    var showAnswerBtn = document.getElementById('show-answer-btn');
    if (showAnswerBtn) {
        showAnswerBtn.onclick = function () {
            if (!currentCard) return;
            previewCard(currentCard.id, currentCard.name);
            fillCardTable(currentCard);
        };
    }
});

// setMap和rarityMap已移至翻译框架，这里保持兼容性
window.setMap = window.HSTranslator.setMap;
window.rarityMap = window.HSTranslator.rarityMap;
function getAllSets() {
    if (!window.hsCards) return [];
    // 按发布时间顺序（与setNearRange中的setOrder保持一致）
    const order = [
        'VANILLA', 'NAXX', 'GVG', 'BRM', 'TGT', 'LOE', 'OG', 'KARA', 'GANGS', 'UNGORO', 'ICECROWN', 'LOOTAPALOOZA', 'GILNEAS', 'BOOMSDAY', 'TROLL', 'DALARAN', 'ULDUM', 'DRAGONS', 'YEAR_OF_THE_DRAGON', 'DEMON_HUNTER_INITIATE', 'BLACK_TEMPLE', 'SCHOLOMANCE', 'DARKMOON_FAIRE', 'THE_BARRENS', 'STORMWIND', 'ALTERAC_VALLEY', 'THE_SUNKEN_CITY', 'REVENDRETH', 'PATH_OF_ARTHAS', 'RETURN_OF_THE_LICH_KING', 'WONDERS', 'BATTLE_OF_THE_BANDS', 'TITANS', 'WILD_WEST', 'CORE', 'EVENT', 'WHIZBANGS_WORKSHOP', 'ISLAND_VACATION', 'SPACE', 'EMERALD_DREAM', 'THE_LOST_CITY'
    ];
    const sets = Array.from(new Set(window.hsCards.filter(c => c.type === 'MINION').map(c => c.set)));
    // 按order排序，order中没有的排后面
    const sorted = order.filter(code => sets.includes(code)).concat(sets.filter(code => !order.includes(code)));
    return sorted.map(code => ({ code, name: window.setMap[code] || code }));
}
function getAllRarities() {
    if (!window.hsCards) return [];
    // 稀有度优先顺序
    const order = ['FREE', 'COMMON', 'RARE', 'EPIC', 'LEGENDARY'];
    // 只保留实际存在的稀有度
    const exist = Array.from(new Set(window.hsCards.filter(c => c.type === 'MINION').map(c => c.rarity)));
    // 按order排序，order中没有的排后面
    const sorted = order.filter(code => exist.includes(code)).concat(exist.filter(code => !order.includes(code)));
    return sorted.map(code => ({ code, name: window.rarityMap[code] || code }));
}

// 通用多选弹窗
// options为对象数组：{code, name}
function showMultiSelectDialog(title, options, selected, onConfirm) {
    let old = document.getElementById('multi-select-dialog');
    if (old) old.remove();
    let dialog = document.createElement('div');
    dialog.id = 'multi-select-dialog';
    dialog.style.position = 'fixed';
    dialog.style.left = '0';
    dialog.style.top = '0';
    dialog.style.width = '100vw';
    dialog.style.height = '100vh';
    dialog.style.background = 'rgba(0,0,0,0.18)';
    dialog.style.zIndex = '9999';
    dialog.innerHTML = `
        <div style="background:#fff; border-radius:10px; box-shadow:0 2px 16px rgba(0,0,0,0.18); width:340px; max-width:90vw; padding:22px 18px 16px 18px; position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);">
            <div style="font-size:17px; font-weight:bold; margin-bottom:12px;">${title}</div>
            <div style="max-height:260px; overflow-y:auto; margin-bottom:16px;">
                ${options.map(opt => `
                    <label style='display:block; margin-bottom:7px; font-size:15px; cursor:pointer;'><input type='checkbox' value='${opt.code}' ${selected.includes(opt.code) ? 'checked' : ''} style='margin-right:7px;'>${opt.name}</label>
                `).join('')}
            </div>
            <div style="text-align:right;">
                <button id="multi-select-cancel" style="margin-right:10px; background:#aaa; color:#fff; border:none; border-radius:5px; padding:6px 16px; font-size:14px;">取消</button>
                <button id="multi-select-ok" style="background:#27ae60; color:#fff; border:none; border-radius:5px; padding:6px 16px; font-size:14px;">确定</button>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);
    dialog.querySelector('#multi-select-cancel').onclick = function () {
        dialog.remove();
    };
    dialog.querySelector('#multi-select-ok').onclick = function () {
        const checked = Array.from(dialog.querySelectorAll('input[type=checkbox]:checked')).map(cb => cb.value);
        dialog.remove();
        onConfirm(checked);
    };
}