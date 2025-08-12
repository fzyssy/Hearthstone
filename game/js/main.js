// 主入口文件 - 页面加载完成后初始化游戏和卡牌库
document.addEventListener('DOMContentLoaded', () => {
    // 初始化游戏
    window._game = new HearthstoneGame();

    // 卡牌库相关变量
    let cardLibPage = 1;
    const cardsPerPage = 8;
    let sortedCards = [];

    // 渲染卡牌库页面
    function renderCardLibraryPage(page) {
        const list = document.getElementById('card-library-list');

        if (sortedCards.length === 0) {
            // 合并随从、武器和法术配置，按费用排序
            const allCards = [
                ...MINION_CONFIGS.map(cfg => ({ ...cfg, type: 'minion' })),
                ...WEAPON_CONFIGS.map(cfg => ({ ...cfg, type: 'weapon' })),
                ...SPELL_CONFIGS.map(cfg => ({ ...cfg, type: 'spell' }))
            ];
            sortedCards = allCards.sort((a, b) => a.cost - b.cost);
        }

        const totalPages = Math.ceil(sortedCards.length / cardsPerPage);
        cardLibPage = Math.max(1, Math.min(page, totalPages));
        const startIdx = (cardLibPage - 1) * cardsPerPage;
        const pageCards = sortedCards.slice(startIdx, startIdx + cardsPerPage);

        list.innerHTML = '';

        pageCards.forEach(cfg => {
            if (cfg.type === 'minion') {
                const effects = [];
                if (cfg.taunt) effects.push('<span class="text-blue-400 font-semibold"><i class="fa fa-shield"></i> 嘲讽</span>');
                if (cfg.charge) effects.push('<span class="text-green-400 font-semibold"><i class="fa fa-bolt"></i> 冲锋</span>');
                if (cfg.rush) effects.push('<span class="text-orange-400 font-semibold"><i class="fa fa-bolt"></i> 突袭</span>');
                if (cfg.windfury) effects.push('<span class="text-cyan-300 font-semibold"><i class="fa fa-refresh"></i> 风怒</span>');
                if (cfg.divineShield) effects.push('<span class="text-yellow-300 font-semibold"><i class="fa fa-circle-o"></i> 圣盾</span>');
                if (cfg.stealth) effects.push('<span class="text-purple-400 font-semibold"><i class="fa fa-eye-slash"></i> 潜行</span>');
                if (cfg.poisonous) effects.push('<span class="text-green-500 font-semibold"><i class="fa fa-tint"></i> 剧毒</span>');
                if (cfg.lifesteal) effects.push('<span class="text-red-400 font-semibold"><i class="fa fa-heart"></i> 吸血</span>');
                if (cfg.enrage) {
                    if (cfg.name === "格罗玛什·地狱咆哮") {
                        effects.push('<span class="text-red-500 font-semibold"><i class="fa fa-fire"></i> 激怒</span>');
                    }
                }

                list.innerHTML += `
                <div class="bg-gradient-to-br from-card to-primary/80 rounded-2xl p-4 shadow-xl border-4 border-secondary flex flex-col items-center gap-2 relative card-hover" style="width:160px; min-height:240px; position:relative;">
                    <div class="absolute top-2 left-2 bg-gradient-to-br from-secondary to-yellow-300 text-primary rounded-full w-7 h-7 flex items-center justify-center text-base font-bold shadow border-2 border-white" style="z-index:2;">${cfg.cost}</div>
                    <div class="font-bold text-lg text-center mb-1 mt-3 tracking-wide drop-shadow">${cfg.name}</div>
                    <div class="flex gap-2 text-sm mt-1 mb-2 justify-center">${effects.join(' ')}</div>
                    <div class="w-full border-t border-secondary/40 my-2"></div>
                    <div class="flex w-full justify-between items-end px-2 mt-auto mb-1">
                        <span class="bg-gradient-to-r from-red-700 to-red-500 px-2 py-1 rounded-lg text-base font-bold flex items-center gap-1 shadow border border-red-900"><i class="fa fa-gavel"></i> ${cfg.attack}</span>
                        <span class="bg-gradient-to-r from-green-700 to-green-500 px-2 py-1 rounded-lg text-base font-bold flex items-center gap-1 shadow border border-green-900"><i class="fa fa-heart"></i> ${cfg.health}</span>
                    </div>
                </div>
                `;
            } else if (cfg.type === 'weapon') {
                list.innerHTML += `
                <div class="bg-gradient-to-br from-amber-700 to-amber-900 rounded-2xl p-4 shadow-xl border-4 border-amber-400 flex flex-col items-center gap-2 relative card-hover" style="width:160px; min-height:240px; position:relative;">
                    <div class="absolute top-2 left-2 bg-gradient-to-br from-secondary to-yellow-300 text-primary rounded-full w-7 h-7 flex items-center justify-center text-base font-bold shadow border-2 border-white" style="z-index:2;">${cfg.cost}</div>
                    <div class="font-bold text-lg text-center mb-1 mt-3 tracking-wide drop-shadow text-amber-100">${cfg.name}</div>
                    <i class="fa fa-gavel text-amber-200 text-4xl my-2"></i>
                    <div class="text-amber-300 text-sm font-semibold">武器</div>
                    <div class="w-full border-t border-amber-400/40 my-2"></div>
                    <div class="flex w-full justify-between items-end px-2 mt-auto mb-1">
                        <span class="bg-gradient-to-r from-red-700 to-red-500 px-2 py-1 rounded-lg text-base font-bold flex items-center gap-1 shadow border border-red-900"><i class="fa fa-gavel"></i> ${cfg.attack}</span>
                        <span class="bg-gradient-to-r from-blue-700 to-blue-500 px-2 py-1 rounded-lg text-base font-bold flex items-center gap-1 shadow border border-blue-900"><i class="fa fa-shield"></i> ${cfg.durability}</span>
                    </div>
                </div>
                `;
            } else if (cfg.type === 'spell') {
                list.innerHTML += `
                <div class="bg-gradient-to-br from-purple-700 to-purple-900 rounded-2xl p-4 shadow-xl border-4 border-purple-400 flex flex-col items-center gap-2 relative card-hover" style="width:160px; min-height:240px; position:relative;">
                    <div class="absolute top-2 left-2 bg-gradient-to-br from-secondary to-yellow-300 text-primary rounded-full w-7 h-7 flex items-center justify-center text-base font-bold shadow border-2 border-white" style="z-index:2;">${cfg.cost}</div>
                    <div class="font-bold text-lg text-center mb-1 mt-3 tracking-wide drop-shadow text-purple-100">${cfg.name}</div>
                    <i class="fa fa-magic text-purple-200 text-4xl my-2"></i>
                    <div class="text-purple-300 text-sm font-semibold">法术</div>
                    <div class="w-full border-t border-purple-400/40 my-2"></div>
                    <div class="text-xs text-purple-200 text-center px-2 leading-tight">${cfg.description}</div>
                </div>
                `;
            }
        });

        // 页码信息
        document.getElementById('card-lib-page-info').textContent = `第 ${cardLibPage} / ${totalPages} 页`;

        // 按钮状态
        document.getElementById('card-lib-prev').disabled = cardLibPage === 1;
        document.getElementById('card-lib-next').disabled = cardLibPage === totalPages;
    }

    // 卡牌库事件监听器
    document.getElementById('card-library').addEventListener('click', () => {
        // 重置卡牌数据
        const allCards = [
            ...MINION_CONFIGS.map(cfg => ({ ...cfg, type: 'minion' })),
            ...WEAPON_CONFIGS.map(cfg => ({ ...cfg, type: 'weapon' })),
            ...SPELL_CONFIGS.map(cfg => ({ ...cfg, type: 'spell' }))
        ];
        sortedCards = allCards.sort((a, b) => a.cost - b.cost);
        cardLibPage = 1;
        renderCardLibraryPage(cardLibPage);
        document.getElementById('card-library-modal').classList.remove('hidden');
    });

    document.getElementById('card-lib-prev').addEventListener('click', () => {
        renderCardLibraryPage(cardLibPage - 1);
    });

    document.getElementById('card-lib-next').addEventListener('click', () => {
        renderCardLibraryPage(cardLibPage + 1);
    });

    document.getElementById('close-card-library').addEventListener('click', () => {
        document.getElementById('card-library-modal').classList.add('hidden');
    });

    // 模态框点击外部关闭
    document.getElementById('game-mode-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('game-mode-modal')) {
            // 游戏模式选择不允许点击外部关闭
        }
    });

    document.getElementById('adventure-mode-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('adventure-mode-modal')) {
            // 冒险模式选择不允许点击外部关闭
        }
    });

    document.getElementById('card-library-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('card-library-modal')) {
            document.getElementById('card-library-modal').classList.add('hidden');
        }
    });

    document.getElementById('help-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('help-modal')) {
            document.getElementById('help-modal').classList.add('hidden');
        }
    });
});
