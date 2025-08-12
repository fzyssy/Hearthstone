// 联机对战按钮逻辑（WebSocket接入）
// 日志窗口相关
function appendLog(msg) {
    let logWin = document.getElementById('online-log-window');
    if (!logWin) {
        logWin = document.createElement('div');
        logWin.id = 'online-log-window';
        logWin.style.position = 'fixed';
        logWin.style.left = '20px';
        logWin.style.bottom = '20px';
        logWin.style.width = '340px';
        logWin.style.maxHeight = '320px';
        logWin.style.overflowY = 'auto';
        logWin.style.background = 'rgba(255,255,255,0.97)';
        logWin.style.border = '1px solid #bbb';
        logWin.style.borderRadius = '8px';
        logWin.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
        logWin.style.fontSize = '14px';
        logWin.style.color = '#222';
        logWin.style.padding = '12px 16px 12px 12px';
        logWin.style.zIndex = '9999';
        logWin.innerHTML = '<b>房间日志</b><hr style="margin:6px 0 10px 0;">';
        document.body.appendChild(logWin);
    }
    const p = document.createElement('div');
    p.style.marginBottom = '4px';
    p.innerHTML = msg;
    logWin.appendChild(p);
    // 滚动到底部
    logWin.scrollTop = logWin.scrollHeight;
    // 最多保留50条
    while (logWin.children.length > 52) logWin.removeChild(logWin.children[2]);
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
            appendLog(`<span style='color:#4a90e2;'>你(${userId}) 正在尝试加入房间...</span>`);
            ws.onopen = function () {
                ws.send(JSON.stringify({ type: 'join', userId }));
            };
            ws.onmessage = function (event) {
                let data;
                try { data = JSON.parse(event.data); } catch { return; }
                if (data.type === 'error') {
                    alert('联机失败：' + data.msg);
                    appendLog(`<span style='color:#e74c3c;'>错误：${data.msg}</span>`);
                    ws.close();
                } else if (data.type === 'system') {
                    showOnlineMsg(data.msg + (data.players ? ('\n当前玩家：' + data.players.join(',')) : ''));
                    if (data.msg && data.msg.includes('加入了房间')) {
                        appendLog(`<span style='color:#27ae60;'>${data.msg}</span>`);
                    } else if (data.msg && data.msg.includes('有玩家离开')) {
                        appendLog(`<span style='color:#e67e22;'>${data.msg}</span>`);
                    } else {
                        appendLog(data.msg);
                    }
                    if (data.players) {
                        appendLog(`<span style='color:#888;'>当前玩家：${data.players.join(', ')}</span>`);
                    }
                } else if (data.type === 'turn') {
                    isMyTurn = (data.userId === myUserId);
                    updateInputState();
                    if (isMyTurn) {
                        showOnlineMsg('轮到你猜卡牌！');
                        appendLog(`<b style='color:#4a90e2;'>现在轮到你猜卡牌</b>`);
                    } else {
                        showOnlineMsg('轮到 ' + data.userId + ' 猜卡牌');
                        appendLog(`<span style='color:#4a90e2;'>现在轮到 ${data.userId} 猜卡牌</span>`);
                    }
                } else if (data.type === 'guess') {
                    if (data.cardId && data.cardName) {
                        fillCardTable({ id: data.cardId, name: data.cardName });
                        appendLog(`<span style='color:#222;'>${data.userId} 猜了：<b>${data.cardName}</b></span>`);
                    } else {
                        appendLog(`${data.userId} 猜了：${data.guess}`);
                    }
                    showOnlineMsg(data.userId + ' 猜了：' + (data.cardName || data.guess));
                }
            };
            ws.onclose = function () {
                showOnlineMsg('已断开与服务器的连接');
                appendLog(`<span style='color:#e74c3c;'>你已断开与服务器的连接</span>`);
                onlineBtn.disabled = false; // 断开后可重新点击
                wsConnected = false;
            };
        };
    }
});

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
let isMyTurn = false;
let ws = null;
let roomUsers = [];
let currentTurnUser = null;
let allMinionCards = [];

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

    // 不清空搜索栏和搜索结果，实现多选
    // 保持左侧图片，不清空

    fillCardTable(card);
    // 无论何时，只要猜中就弹窗
    if (currentCard && card.name === currentCard.name) {
        showCongrats();
    }
}


function fillCardTable(card) {
    // 填充右侧表格，使用翻译框架
    const tbody = document.getElementById('card-table-body');
    // 关键词逻辑：mechanics + text + referencedTags
    let keywordSet = new Set();
    // 1. mechanics 字段
    if (card.mechanics && Array.isArray(card.mechanics)) {
        card.mechanics.forEach(m => keywordSet.add(m));
    }
    // 2. referencedTags 字段
    if (card.referencedTags && Array.isArray(card.referencedTags)) {
        card.referencedTags.forEach(m => keywordSet.add(m));
    }
    // 3. text 字段，补充休眠/免疫等（防止API未标注）
    if (typeof card.text === 'string') {
        if (card.text.includes('休眠') || card.text.toLowerCase().includes('dormant')) keywordSet.add('DORMANT');
        if (card.text.includes('免疫') || card.text.toLowerCase().includes('immune')) keywordSet.add('IMMUNE');
    }
    // 排除无用机制
    ['TRIGGER_VISUAL', 'AURA'].forEach(k => keywordSet.delete(k));
    // 翻译并排序
    let mechanicsStr = Array.from(keywordSet)
        .map(k => window.HSTranslator.translate('mechanics', k))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'zh-CN'))
        .join('，');
    // 对比答案卡牌
    const answer = currentCard;
    // mechanics 需特殊处理为字符串再对比
    // 答案卡牌也用同样的关键词逻辑
    let answerKeywordSet = new Set();
    if (answer.mechanics && Array.isArray(answer.mechanics)) {
        answer.mechanics.forEach(m => answerKeywordSet.add(m));
    }
    if (answer.referencedTags && Array.isArray(answer.referencedTags)) {
        answer.referencedTags.forEach(m => answerKeywordSet.add(m));
    }
    if (typeof answer.text === 'string') {
        if (answer.text.includes('休眠') || answer.text.toLowerCase().includes('dormant')) answerKeywordSet.add('DORMANT');
        if (answer.text.includes('免疫') || answer.text.toLowerCase().includes('immune')) answerKeywordSet.add('IMMUNE');
    }
    ['TRIGGER_VISUAL', 'AURA'].forEach(k => answerKeywordSet.delete(k));
    let answerMechanicsStr = Array.from(answerKeywordSet)
        .map(k => window.HSTranslator.translate('mechanics', k))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'zh-CN'))
        .join('，');
    function highlight(same) {
        return same ? 'background:#ffe066;font-weight:bold;' : '';
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
        if (Math.abs(user - ans) <= 3) return 'background:#d0f5e8;';
        return '';
    }
    // 如果没有种族，显示为空
    const raceStr = card.race ? window.HSTranslator.translate('race', card.race) : '';
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
    function classHighlight(card, answer) {
        // 双职业高亮：完全一致才高亮
        if (Array.isArray(card.classes) && Array.isArray(answer.classes)) {
            if (card.classes.length === answer.classes.length && card.classes.every((v, i) => v === answer.classes[i])) {
                return highlight(true);
            }
        } else if (card.cardClass === answer.cardClass) {
            return highlight(true);
        }
        return '';
    }
    tbody.innerHTML += `
        <tr>
            <td style="padding:6px 8px; text-align:center;${highlight(card.name === answer.name)}">${card.name}</td>
            <td style="padding:6px 8px; text-align:center;${highlight(card.type === answer.type)}">${window.HSTranslator.translate('type', card.type)}</td>
            <td style="padding:6px 8px; text-align:center;${highlight(card.rarity === answer.rarity)}">${window.HSTranslator.translate('rarity', card.rarity, '基础')}</td>
            <td style="padding:6px 8px; text-align:center;${classHighlight(card, answer)}">${getClassStr(card)}</td>
            <td style="padding:6px 8px; text-align:center;${nearRange(card.cost, answer.cost)}">${card.cost || 0} ${numberHint(card.cost, answer.cost)}</td>
            <td style="padding:6px 8px; text-align:center;${nearRange(card.attack, answer.attack)}">${card.attack || 0} ${numberHint(card.attack, answer.attack)}</td>
            <td style="padding:6px 8px; text-align:center;${nearRange(card.health, answer.health)}">${card.health || 0} ${numberHint(card.health, answer.health)}</td>
            <td style="padding:6px 8px; text-align:center;${highlight(mechanicsStr === answerMechanicsStr)}">${mechanicsStr}</td>
            <td style="padding:6px 8px; text-align:center;${highlight(card.race === answer.race)}">${raceStr}</td>
            <td style="padding:6px 8px; text-align:center;${highlight(card.set === answer.set)}">${window.HSTranslator.translate('set', card.set)}</td>
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


function backToMenu() {
    // 返回主菜单（暂未用）
    document.getElementById('game-interface').style.display = 'none';
    document.getElementById('answer-display').style.display = 'none';
    document.querySelector('.container').style.display = 'block';

    currentCard = null;
}


async function loadHearthstoneCards() {
    // 加载炉石卡牌API数据
    try {
        const response = await fetch('https://api.hearthstonejson.com/v1/latest/zhCN/cards.collectible.json');
        if (!response.ok) throw new Error('网络错误');
        let cards = await response.json();
        // 过滤掉拓展包为“PLACEHOLDER_202204”的卡牌
        cards = cards.filter(card => card.set !== 'PLACEHOLDER_202204');
        console.log('卡牌数据加载成功（已过滤PLACEHOLDER_202204），共', cards.length, '张卡牌');
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
                startNewGame();
            });
        };
    }
    // 筛选稀有度
    var filterRarityBtn = document.getElementById('filter-rarity');
    if (filterRarityBtn) {
        filterRarityBtn.onclick = function () {
            showMultiSelectDialog('选择稀有度', getAllRarities(), selectedRarities, function (newSelected) {
                selectedRarities = newSelected;
                startNewGame();
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
    // 按发布时间顺序
    const order = [
        'VANILLA', 'EXPERT1', 'NAXX', 'GVG', 'BRM', 'TGT', 'LOE', 'OG', 'KARA', 'GANGS',
        'UNGORO', 'ICECROWN', 'LOOTAPALOOZA', 'WITCHWOOD', 'BOOMSDAY', 'RUMBLE', 'DALARAN',
        'ULDUM', 'DRAGONS', 'YEAR_OF_THE_DRAGON', 'DEMON_HUNTER_INITIATE', 'SCHOLOMANCE',
        'DARKMOON_FAIRE', 'THE_BARRENS', 'STORMWIND', 'ALTERAC_VALLEY', 'THE_SUNKEN_CITY',
        'CASTLE_NATHRIA', 'PATH_OF_ARTHAS', 'MARCH_OF_THE_LICH_KING', 'BATTLE_OF_THE_BANDS',
        'TITANS', 'SHOWDOWN_IN_THE_BADLANDS', 'WHIZBANGS_WORKSHOP', 'WONDERS'
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