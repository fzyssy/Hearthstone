// 炉石传说游戏主类
class HearthstoneGame {
    constructor() {
        this.playerClass = null;
        this.enemyClass = null;
        this.minionIdCounter = 1;
        this.gameMode = null; // 'practice' 或 'vs-ai'
        this.adventureMode = null; // 'random', 'charge', 'rush', 'taunt', 'lifesteal', 'windfury'
        this.isAITurn = false;
        this.aiThinkingTime = 1500; // AI思考时间(毫秒)
        this.initEventListeners();
        this.showGameModeModal();
    }
    
    // 动画相关方法
    playAttackAnimation(attackerElement, targetElement, callback) {
        if (!attackerElement || !targetElement) {
            callback && callback();
            return;
        }

        const attackerRect = attackerElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        
        const deltaX = targetRect.left - attackerRect.left;
        const deltaY = targetRect.top - attackerRect.top;
        
        attackerElement.style.setProperty('--attack-x', `${deltaX * 0.3}px`);
        attackerElement.style.setProperty('--attack-y', `${deltaY * 0.3}px`);
        
        attackerElement.classList.add('attack-move');
        
        this.createBattleEffect(targetElement);
        
        setTimeout(() => {
            attackerElement.classList.remove('attack-move');
            attackerElement.style.removeProperty('--attack-x');
            attackerElement.style.removeProperty('--attack-y');
            callback && callback();
        }, 800);
    }

    createBattleEffect(targetElement) {
        const effect = document.createElement('div');
        effect.className = 'battle-spark';
        effect.innerHTML = '⚡';
        effect.style.fontSize = '24px';
        effect.style.color = '#FFD700';
        
        targetElement.style.position = 'relative';
        targetElement.appendChild(effect);
        
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 600);
    }

    playHitAnimation(targetElement) {
        if (!targetElement) return;
        
        targetElement.classList.add('hit-shake');
        setTimeout(() => {
            targetElement.classList.remove('hit-shake');
        }, 300);
    }

    playDeathAnimation(targetElement, callback) {
        if (!targetElement) {
            callback && callback();
            return;
        }
        
        targetElement.classList.add('death-fade');
        setTimeout(() => {
            if (targetElement.parentNode) {
                targetElement.parentNode.removeChild(targetElement);
            }
            callback && callback();
        }, 1200);
    }
    
    // 英雄攻击相关方法
    selectHeroAttack(isPlayer) {
        const actor = isPlayer ? this.player : this.enemy;
        if (!actor.heroCanAttack || actor.heroAttacked || actor.heroAttack <= 0 || this.currentPlayer !== actor) {
            this.logMessage("英雄本回合无法攻击");
            return;
        }
        this.clearSelection();
        this.selectedHero = { isPlayer };
        this.highlightHeroAttackTargets(isPlayer);
        this.addCancelAttackListener();
    }

    highlightHeroAttackTargets(isPlayer) {
        const attacker = isPlayer ? this.player : this.enemy;
        const defender = isPlayer ? this.enemy : this.player;
        const enemyBoard = defender.board;
        const enemyMinionElements = document.querySelectorAll(isPlayer ? '#enemy-minions > div' : '#player-minions > div');
        
        const attackableMinions = enemyBoard.filter(m => !m.stealth);
        const tauntMinions = attackableMinions.filter(m => m.taunt);
        const canAttackHero = tauntMinions.length === 0;
        
        if (enemyBoard.length > 0) {
            enemyMinionElements.forEach((el, index) => {
                const minion = enemyBoard[index];
                if (!minion.stealth && (minion.taunt || tauntMinions.length === 0)) {
                    el.classList.add('ring-2', 'ring-yellow-400', 'cursor-pointer');
                    el.addEventListener('click', () => this.heroAttackTarget(isPlayer, 'minion', index), { once: true });
                }
            });
        }
        
        if (canAttackHero) {
            const enemyHeroAvatar = document.querySelector(isPlayer ? '.enemy-hero-avatar' : '.player-hero-avatar');
            if (enemyHeroAvatar) {
                enemyHeroAvatar.classList.add('ring-4', 'ring-yellow-400', 'cursor-pointer');
                enemyHeroAvatar.addEventListener('click', () => this.heroAttackTarget(isPlayer, 'hero', 0), { once: true });
            }
        }
    }

    heroAttackTarget(isPlayer, type, index) {
        const actor = isPlayer ? this.player : this.enemy;
        const defender = isPlayer ? this.enemy : this.player;
        let target;
        if (type === 'minion') {
            target = defender.board[index];
        } else {
            target = defender;
        }

        const attackerElement = document.querySelector(isPlayer ? '.player-hero-avatar' : '.enemy-hero-avatar');
        let targetElement;
        if (type === 'minion') {
            const targetBoard = document.querySelector(isPlayer ? '#enemy-minions' : '#player-minions');
            targetElement = targetBoard.children[index];
        } else {
            targetElement = document.querySelector(isPlayer ? '.enemy-hero-avatar' : '.player-hero-avatar');
        }

        this.playAttackAnimation(attackerElement, targetElement, () => {
            const result = actor.attackWithHero(target);
            if (result.success) {
                this.playHitAnimation(targetElement);

                if (target instanceof Minion) {
                    this.logMessage(`${actor.name}英雄${actor.weapon ? '使用' + actor.weapon.name : ''}攻击了${target.name}`);
                    if (result.targetDied) {
                        this.logMessage(`${target.name}被消灭了，进入弃牌堆`);
                        const board = defender.board;
                        const graveyard = defender.graveyard;
                        const idx = board.indexOf(target);
                        if (idx !== -1) {
                            const deadMinion = board.splice(idx, 1)[0];
                            graveyard.push(deadMinion);
                        }
                        this.playDeathAnimation(targetElement, () => {
                            this.updateGameUI();
                        });
                    } else {
                        this.updateGameUI();
                    }
                    if (result.heroDied) {
                        this.logMessage(`${actor.name}英雄被反击消灭！`);
                    }
                } else {
                    this.logMessage(`${actor.name}英雄${actor.weapon ? '使用' + actor.weapon.name : ''}攻击了${defender.name}英雄，造成${result.damageDealt}点伤害`);
                    this.updateGameUI();
                }
                this.selectedHero = null;
                this.clearSelection();
                this.checkGameOver();
            }
        });
    }
    
    // 显示游戏模式选择（返回欢迎页面）
    showGameModeSelection() {
        // 重置游戏状态
        this.gameOver = false;
        this.gameMode = null;
        this.adventureMode = null;
        this.currentPlayer = null;
        this.turnCount = 0;
        this.isAITurn = false;
        
        // 清理现有的游戏数据
        if (this.player) this.player = null;
        if (this.enemy) this.enemy = null;
        if (this.aiController) this.aiController = null;
        
        // 隐藏游戏结束弹窗
        document.getElementById('game-over-modal').classList.add('hidden');
        document.getElementById('choose-class-modal').classList.add('hidden');
        document.getElementById('adventure-mode-modal').classList.add('hidden');
        
        // 显示模式选择对话框
        document.getElementById('game-mode-modal').classList.remove('hidden');
        
        // 记录日志
        this.logMessage("返回游戏模式选择...");
    }

    // 游戏初始化和流程控制
    showGameModeModal() {
        const modal = document.getElementById('game-mode-modal');
        const practiceBtn = document.getElementById('practice-mode');
        const vsAiBtn = document.getElementById('vs-ai-mode');
        
        practiceBtn.onclick = () => {
            this.gameMode = 'practice';
            modal.classList.add('hidden');
            this.showChooseClassModal();
        };
        
        vsAiBtn.onclick = () => {
            this.gameMode = 'vs-ai';
            modal.classList.add('hidden');
            this.showAdventureModeModal();
        };
    }
    
    showAdventureModeModal() {
        const modal = document.getElementById('adventure-mode-modal');
        modal.classList.remove('hidden');
        
        // 绑定各个模式按钮 - 修改为直接使用随机职业开始游戏
        document.getElementById('random-cards-mode').onclick = () => {
            this.adventureMode = 'random';
            modal.classList.add('hidden');
            this.startAdventureWithRandomClasses();
        };
        
        document.getElementById('charge-mode').onclick = () => {
            this.adventureMode = 'charge';
            modal.classList.add('hidden');
            this.startAdventureWithRandomClasses();
        };
        
        document.getElementById('rush-mode').onclick = () => {
            this.adventureMode = 'rush';
            modal.classList.add('hidden');
            this.startAdventureWithRandomClasses();
        };
        
        document.getElementById('taunt-mode').onclick = () => {
            this.adventureMode = 'taunt';
            modal.classList.add('hidden');
            this.startAdventureWithRandomClasses();
        };
        
        document.getElementById('lifesteal-mode').onclick = () => {
            this.adventureMode = 'lifesteal';
            modal.classList.add('hidden');
            this.startAdventureWithRandomClasses();
        };
        
        document.getElementById('windfury-mode').onclick = () => {
            this.adventureMode = 'windfury';
            modal.classList.add('hidden');
            this.startAdventureWithRandomClasses();
        };
    }
    
    // 新增方法：为冒险模式选择随机职业并开始游戏
    startAdventureWithRandomClasses() {
        // 获取所有可用的职业
        const availableClasses = HERO_CLASSES.filter(cls => cls.enabled);
        
        // 随机选择玩家和敌人的职业
        const randomPlayerClass = availableClasses[Math.floor(Math.random() * availableClasses.length)];
        const randomEnemyClass = availableClasses[Math.floor(Math.random() * availableClasses.length)];
        
        // 设置职业
        this.playerClass = randomPlayerClass;
        this.enemyClass = randomEnemyClass;
        window._game_playerClass = randomPlayerClass;
        window._game_enemyClass = randomEnemyClass;
        
        // 直接开始游戏
        setTimeout(() => this.startNewGame(), 100);
    }
    
    showChooseClassModal() {
        const modal = document.getElementById('choose-class-modal');
        const classList = document.getElementById('class-list');
        const stepText = document.getElementById('class-select-step');
        const confirmBtn = document.getElementById('confirm-class');
        let step = 0;
        let selectedPlayerClass = null;
        let selectedEnemyClass = null;
        
        // 显示职业选择模态框
        modal.classList.remove('hidden');
        
        function renderClassOptions() {
            classList.innerHTML = '';
            HERO_CLASSES.forEach(cls => {
                const disabled = !cls.enabled;
                let avatarHtml = '';
                if (cls.key === 'deathknight') {
                    avatarHtml = `<svg width="40" height="40" viewBox="0 0 60 60" class="mx-auto mb-1"><circle cx="30" cy="30" r="28" fill="#222"/><text x="30" y="38" text-anchor="middle" font-size="32" fill="#00eaff" font-family="serif" font-weight="bold">DK</text></svg>`;
                } else {
                    avatarHtml = `<i class="fa ${cls.icon} text-3xl mb-1"></i>`;
                }
                classList.innerHTML += `
                <div class="bg-card rounded-lg p-3 shadow border ${cls.enabled ? 'border-secondary cursor-pointer hover:ring-2 hover:ring-secondary' : 'border-gray-700 opacity-50'} flex flex-col items-center gap-2"
                    data-key="${cls.key}" style="position:relative;${disabled ? 'pointer-events:none;' : ''}">
                    ${avatarHtml}
                    <span class="font-bold">${cls.name}</span>
                    <span class="text-xs text-gray-300">${cls.skill}</span>
                    ${disabled ? '<span class="absolute top-1 right-1 text-red-400 text-xs">不可选</span>' : ''}
                </div>`;
            });
        }
        
        renderClassOptions();
        let selectedKey = null;
        
        classList.addEventListener('click', function (e) {
            const card = e.target.closest('[data-key]');
            if (!card) return;
            selectedKey = card.dataset.key;
            [...classList.children].forEach(c => c.classList.remove('ring-4', 'ring-secondary'));
            card.classList.add('ring-4', 'ring-secondary');
            confirmBtn.classList.remove('hidden');
        });
        
        confirmBtn.onclick = function () {
            if (!selectedKey) return;
            if (step === 0) {
                selectedPlayerClass = HERO_CLASSES.find(c => c.key === selectedKey);
                // 无论什么模式，都让玩家选择对手职业
                step = 1;
                stepText.textContent = '请选择对手的职业：';
                confirmBtn.classList.add('hidden');
                selectedKey = null;
                renderClassOptions();
            } else {
                selectedEnemyClass = HERO_CLASSES.find(c => c.key === selectedKey);
                modal.classList.add('hidden');
                window._game_playerClass = selectedPlayerClass;
                window._game_enemyClass = selectedEnemyClass;
                setTimeout(() => window._game && window._game.startNewGame(), 100);
            }
        };
    }

    startNewGame() {
        // 使用实例中已保存的职业信息，或者从全局变量获取（首次游戏）
        this.playerClass = this.playerClass || window._game_playerClass || HERO_CLASSES[0];
        this.enemyClass = this.enemyClass || window._game_enemyClass || HERO_CLASSES[1];
        
        // 保存到全局变量（为了兼容性）
        window._game_playerClass = this.playerClass;
        window._game_enemyClass = this.enemyClass;
        
        this.player = new Player("你", true, this.playerClass);
        this.enemy = new Player("对手", false, this.enemyClass);
        this.player.enemy = this.enemy;
        this.enemy.enemy = this.player;
        this.currentPlayer = this.player;
        this.turnCount = 1;
        this.selectedMinion = null;
        this.gameOver = false;
        this.minionIdCounter = 1;
        this.heroPowerUsed = { player: false, enemy: false };
        this.isAITurn = false;
        
        // 创建AI实例
        if (this.gameMode === 'vs-ai') {
            this.aiController = new HearthstoneAI(this);
        }
        
        const logElement = document.getElementById('game-log');
        logElement.innerHTML = '';
        
        this.initializeDecks();
        
        for (let i = 0; i < GAME_CONSTANTS.FIRST_PLAYER_CARDS; i++) {
            this.player.drawCard();
            this.enemy.drawCard();
        }
        this.player.drawCard();
        
        this.player.maxManaCrystals = 1;
        this.player.manaCrystals = this.player.maxManaCrystals;
        this.enemy.maxManaCrystals = 0;
        this.enemy.manaCrystals = 0;
        
        document.getElementById('game-status').textContent = `${this.currentPlayer.name}的回合 (第${this.turnCount}回合)`;
        this.updateGameUI();
        
        if (this.gameMode === 'vs-ai') {
            this.logMessage(`游戏开始！你(${this.playerClass.name})先手，对手职业：${this.enemyClass.name}`);
        } else {
            this.logMessage("游戏开始！你先手");
        }
        
        document.getElementById('game-over-modal').classList.add('hidden');
    }
    
    // 重新开始游戏（保持当前模式和职业）
    restartGame() {
        // 检查是否已经有游戏进行中
        if (!this.gameMode || !this.playerClass || !this.enemyClass) {
            // 如果没有当前游戏状态，返回模式选择
            this.showGameModeSelection();
            return;
        }
        
        // 隐藏所有弹窗
        document.getElementById('game-over-modal').classList.add('hidden');
        document.getElementById('choose-class-modal').classList.add('hidden');
        document.getElementById('game-mode-modal').classList.add('hidden');
        document.getElementById('adventure-mode-modal').classList.add('hidden');
        
        // 直接重新开始游戏，保持当前模式和职业选择
        this.startNewGame();
    }

    initializeDecks() {
        let minionConfigs = MINION_CONFIGS;
        let weaponConfigs = WEAPON_CONFIGS;
        let spellConfigs = SPELL_CONFIGS;
        
        // 根据冒险模式筛选卡牌
        if (this.gameMode === 'vs-ai' && this.adventureMode && this.adventureMode !== 'random') {
            minionConfigs = this.filterMinionsByMode(MINION_CONFIGS, this.adventureMode);
            
            // 特殊冒险模式下，去掉法术和武器卡牌，只使用符合条件的随从
            weaponConfigs = [];
            spellConfigs = [];
            
            // 如果筛选后卡牌太少，添加一些基础卡牌
            if (minionConfigs.length < 8) {
                const basicMinions = MINION_CONFIGS.filter(cfg => !cfg.charge && !cfg.rush && !cfg.taunt && !cfg.lifesteal && !cfg.windfury);
                minionConfigs = [...minionConfigs, ...basicMinions.slice(0, Math.max(10 - minionConfigs.length, 0))];
            }
        }
        
        const playerDeck = [
            ...minionConfigs.map(cfg => GameUtils.createMinion(cfg, this.minionIdCounter++)),
            ...weaponConfigs.map(cfg => GameUtils.createWeapon(cfg, this.minionIdCounter++)),
            ...spellConfigs.map(cfg => GameUtils.createSpell(cfg, this.minionIdCounter++))
        ];
        const enemyDeck = [
            ...minionConfigs.map(cfg => GameUtils.createMinion(cfg, this.minionIdCounter++)),
            ...weaponConfigs.map(cfg => GameUtils.createWeapon(cfg, this.minionIdCounter++)),
            ...spellConfigs.map(cfg => GameUtils.createSpell(cfg, this.minionIdCounter++))
        ];
        
        this.player.deck = GameUtils.shuffleArray(playerDeck);
        this.enemy.deck = GameUtils.shuffleArray(enemyDeck);
        
        // 记录使用的模式
        if (this.adventureMode) {
            this.logMessage(`冒险模式: ${this.getAdventureModeDescription()}`);
        }
    }
    
    filterMinionsByMode(minions, mode) {
        switch (mode) {
            case 'charge':
                return minions.filter(cfg => cfg.charge === true);
            case 'rush':
                return minions.filter(cfg => cfg.rush === true);
            case 'taunt':
                return minions.filter(cfg => cfg.taunt === true);
            case 'lifesteal':
                return minions.filter(cfg => cfg.lifesteal === true);
            case 'windfury':
                return minions.filter(cfg => cfg.windfury === true);
            default:
                return minions;
        }
    }
    
    getAdventureModeDescription() {
        switch (this.adventureMode) {
            case 'random':
                return '使用所有随机卡牌战斗';
            case 'charge':
                return '双方都使用冲锋随从战斗';
            case 'rush':
                return '双方都使用突袭随从战斗';
            case 'taunt':
                return '双方都使用嘲讽随从战斗';
            case 'lifesteal':
                return '双方都使用吸血随从战斗';
            case 'windfury':
                return '双方都使用风怒随从战斗';
            default:
                return '标准模式';
        }
    }
}
