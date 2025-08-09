// 炉石传说游戏主类 - 第二部分（回合处理、UI更新等）
// 这个文件需要在HearthstoneGame.js之后加载

// 扩展HearthstoneGame类
Object.assign(HearthstoneGame.prototype, {
    // 回合处理
    processTurn() {
        if (this.gameOver) return;
        document.getElementById('game-status').textContent = `${this.currentPlayer.name}的回合 (第${this.turnCount}回合)`;
        this.heroPowerUsed.player = false;
        this.heroPowerUsed.enemy = false;
        
        document.getElementById('player-hero-power').disabled = !(this.currentPlayer === this.player) || this.heroPowerUsed.player || this.player.manaCrystals < GAME_CONSTANTS.HERO_POWER_COST || this.gameOver;
        document.getElementById('enemy-hero-power').disabled = !(this.currentPlayer === this.enemy) || this.heroPowerUsed.enemy || this.enemy.manaCrystals < GAME_CONSTANTS.HERO_POWER_COST || this.gameOver;
        
        if (this.turnCount > 1) {
            this.currentPlayer.maxManaCrystals = Math.min(GAME_CONSTANTS.MAX_MANA_CRYSTALS, this.currentPlayer.maxManaCrystals + 1);
            this.currentPlayer.manaCrystals = this.currentPlayer.maxManaCrystals;
            this.logMessage(`${this.currentPlayer.name}获得了${this.currentPlayer.maxManaCrystals}点法力水晶`);
        }
        
        const drawnCard = this.currentPlayer.drawCard();
        if (drawnCard) {
            this.logMessage(`${this.currentPlayer.name}抽到了: ${drawnCard.name}`);
        }
        this.updateGameUI();
    },

    endTurn() {
        if (this.gameOver) return;
        this.logMessage(`${this.currentPlayer.name}结束了回合`);
        
        let removed = 0;
        for (let i = this.currentPlayer.board.length - 1; i >= 0; i--) {
            const m = this.currentPlayer.board[i];
            if (m.name === "食尸鬼" && m.ghoulSummonedThisTurn) {
                const deadGhoul = this.currentPlayer.board.splice(i, 1)[0];
                this.currentPlayer.graveyard.push(deadGhoul);
                removed++;
            }
        }
        if (removed > 0) {
            this.logMessage(`${this.currentPlayer.name}的${removed}个食尸鬼在回合结束时死亡`);
        }
        
        this.currentPlayer.endTurn();
        this.currentPlayer = this.currentPlayer === this.player ? this.enemy : this.player;
        this.turnCount++;
        
        // 立即更新UI以反映回合切换
        this.updateGameUI();
        
        if (this.checkGameOver()) {
            return;
        }
        this.processTurn();
        
        // 如果是AI模式且轮到AI，启动AI回合
        if (this.gameMode === 'vs-ai' && this.currentPlayer === this.enemy && this.aiController) {
            setTimeout(() => {
                this.aiController.executeAITurn();
            }, 1000);
        }
    },

    checkGameOver() {
        if (this.player.health <= 0) {
            this.gameOver = true;
            this.showGameOver(false);
            return true;
        }
        if (this.enemy.health <= 0) {
            this.gameOver = true;
            this.showGameOver(true);
            return true;
        }
        if (this.turnCount > GAME_CONSTANTS.MAX_GAME_TURNS) {
            this.gameOver = true;
            let winner = this.player.health > this.enemy.health ? this.player :
                (this.enemy.health > this.player.health ? this.enemy : null);
            if (winner) {
                this.showGameOver(winner === this.player);
            } else {
                this.showGameOver(null);
            }
            return true;
        }
        return false;
    },

    showGameOver(playerWon) {
        const titleElement = document.getElementById('game-over-title');
        const messageElement = document.getElementById('game-over-message');
        
        if (playerWon === null) {
            titleElement.textContent = "游戏结束";
            messageElement.textContent = "平局！";
        } else if (playerWon) {
            titleElement.textContent = "游戏结束";
            messageElement.textContent = "胜利！";
        } else {
            titleElement.textContent = "游戏结束";
            messageElement.textContent = "失败！";
        }
        
        document.getElementById('game-over-modal').classList.remove('hidden');
        // 游戏结束时的按钮状态由updateGameUI统一管理
    },

    logMessage(message) {
        const logElement = document.getElementById('game-log');
        const logEntry = document.createElement('div');
        logEntry.textContent = message;
        logEntry.className = "text-gray-100 px-2 py-1 rounded hover:bg-secondary/10 transition-all duration-200";
        logElement.appendChild(logEntry);
        logElement.scrollTop = logElement.scrollHeight;
    },
    
    // UI更新方法
    updateGameUI() {
        this.updateTurnIndicator();
        this.updatePlayerStats();
        this.updateMinionBoard('player-minions', this.player.board, true);
        this.updateMinionBoard('enemy-minions', this.enemy.board, false);
        this.updateHand('player-hand', this.player.hand);
        this.updateHand('enemy-hand', this.enemy.hand, true);
        this.updateHeroPowerButtons();
        this.updateHeroAvatars();
        this.updateEndTurnButton();
    },
    
    // 更新结束回合按钮
    updateEndTurnButton() {
        const endTurnBtn = document.getElementById('end-turn');
        const isPlayerTurn = this.currentPlayer === this.player;
        
        if (this.gameOver) {
            endTurnBtn.disabled = true;
            endTurnBtn.classList.remove('ring-2', 'ring-green-400', 'ring-red-400');
            endTurnBtn.innerHTML = '游戏结束';
        } else if (this.gameMode === 'vs-ai' && this.isAITurn) {
            // 只有在真正的AI行动时才禁用按钮并显示AI行动中
            endTurnBtn.disabled = true;
            endTurnBtn.classList.remove('ring-2', 'ring-green-400', 'ring-red-400');
            endTurnBtn.innerHTML = 'AI行动中... <i class="fa fa-spinner fa-spin ml-1"></i>';
        } else {
            // 根据当前回合显示不同的高亮颜色和文本
            if (isPlayerTurn) {
                // 玩家回合时始终启用结束回合按钮
                endTurnBtn.disabled = false;
                endTurnBtn.classList.remove('ring-red-400');
                endTurnBtn.classList.add('ring-2', 'ring-green-400');
                endTurnBtn.innerHTML = '结束回合 <i class="fa fa-arrow-right ml-1"></i>';
            } else {
                // 对手回合（非AI行动状态）
                endTurnBtn.classList.remove('ring-green-400');
                endTurnBtn.classList.add('ring-2', 'ring-red-400');
                if (this.gameMode === 'vs-ai') {
                    // AI模式下，如果不是AI行动状态，说明AI回合已结束，应该切换到玩家回合
                    // 这种情况不应该出现，但为了防止bug，我们直接显示AI回合等待状态
                    endTurnBtn.innerHTML = 'AI回合 <i class="fa fa-clock-o ml-1"></i>';
                    endTurnBtn.disabled = true;
                } else {
                    // 练习模式，允许手动结束对手回合
                    endTurnBtn.innerHTML = '结束对手回合 <i class="fa fa-arrow-right ml-1"></i>';
                    endTurnBtn.disabled = false;
                }
            }
        }
    },
    
    // 更新回合指示器
    updateTurnIndicator() {
        const gameStatus = document.getElementById('game-status');
        const isPlayerTurn = this.currentPlayer === this.player;
        const currentPlayerName = isPlayerTurn ? '你' : '对手';
        const turnColor = isPlayerTurn ? 'text-green-400' : 'text-red-400';
        
        gameStatus.innerHTML = `
            <span class="font-bold ${turnColor}">
                <i class="fa fa-${isPlayerTurn ? 'user' : 'user-secret'} mr-2"></i>
                当前回合: ${currentPlayerName} (回合 ${this.turnCount})
            </span>
        `;
    },
    
    updatePlayerStats() {
        document.getElementById('player-health').textContent = this.player.health;
        document.getElementById('enemy-health').textContent = this.enemy.health;
        
        this.updateArmorDisplay('player', this.player.armor);
        this.updateArmorDisplay('enemy', this.enemy.armor);
        this.updateAttackDisplay('player', this.player.heroAttack);
        this.updateAttackDisplay('enemy', this.enemy.heroAttack);
        this.updateWeaponDisplay('player', this.player.weapon);
        this.updateWeaponDisplay('enemy', this.enemy.weapon);
        
        document.getElementById('player-mana').textContent = this.player.manaCrystals;
        document.getElementById('player-max-mana').textContent = this.player.maxManaCrystals;
        document.getElementById('player-deck-count').textContent = this.player.deck.length;
        document.getElementById('player-graveyard-count').textContent = this.player.graveyard.length;
        document.getElementById('player-fatigue').textContent = this.player.fatigue;

        document.getElementById('enemy-mana').textContent = this.enemy.manaCrystals;
        document.getElementById('enemy-max-mana').textContent = this.enemy.maxManaCrystals;
        document.getElementById('enemy-deck-count').textContent = this.enemy.deck.length;
        document.getElementById('enemy-graveyard-count').textContent = this.enemy.graveyard.length;
        document.getElementById('enemy-fatigue').textContent = this.enemy.fatigue;
    },
    
    updateArmorDisplay(playerType, armor) {
        let armorSpan = document.getElementById(`${playerType}-armor`);
        if (!armorSpan) {
            const healthDiv = document.getElementById(`${playerType}-health`).parentNode;
            armorSpan = document.createElement('span');
            armorSpan.id = `${playerType}-armor`;
            armorSpan.className = 'ml-2 flex items-center gap-1 text-base';
            armorSpan.innerHTML = `<i class="fa fa-shield text-blue-400"></i><span>${armor}</span>`;
            healthDiv.appendChild(armorSpan);
        } else {
            armorSpan.querySelector('span').textContent = armor;
        }
    },
    
    updateAttackDisplay(playerType, attack) {
        let attackSpan = document.getElementById(`${playerType}-attack`);
        if (!attackSpan) {
            const healthDiv = document.getElementById(`${playerType}-health`).parentNode;
            attackSpan = document.createElement('span');
            attackSpan.id = `${playerType}-attack`;
            attackSpan.className = 'ml-2 flex items-center gap-1 text-base';
            attackSpan.innerHTML = `<i class="fa fa-gavel text-yellow-400"></i><span>${attack}</span>`;
            healthDiv.appendChild(attackSpan);
        } else {
            attackSpan.querySelector('span').textContent = attack;
        }
    },
    
    updateWeaponDisplay(playerType, weapon) {
        let weaponSpan = document.getElementById(`${playerType}-weapon`);
        if (!weaponSpan) {
            const heroArea = document.querySelector(`.${playerType}-hero-area`);
            const avatarDiv = heroArea.querySelector(`.${playerType}-hero-avatar`).parentNode;
            weaponSpan = document.createElement('div');
            weaponSpan.id = `${playerType}-weapon`;
            weaponSpan.className = 'absolute -left-12 top-1/2 transform -translate-y-1/2';
            weaponSpan.style.display = 'none';
            avatarDiv.style.position = 'relative';
            avatarDiv.appendChild(weaponSpan);
        }
        
        if (weapon) {
            weaponSpan.style.display = 'block';
            weaponSpan.innerHTML = `
                <div class="bg-amber-600 border-2 border-amber-400 rounded-lg p-1 w-10 h-12 flex flex-col items-center justify-center shadow-lg relative" title="${weapon.name} - 攻击力:${weapon.attack}, 耐久度:${weapon.durability}">
                    <i class="fa fa-gavel text-white text-lg"></i>
                    <div class="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">${weapon.attack}</div>
                    <div class="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">${weapon.durability}</div>
                </div>
            `;
        } else {
            weaponSpan.style.display = 'none';
        }
    },
    
    updateHeroPowerButtons() {
        const playerBtn = document.getElementById('player-hero-power');
        const enemyBtn = document.getElementById('enemy-hero-power');
        
        const playerCanUse = (this.currentPlayer === this.player) && !this.heroPowerUsed.player && this.player.manaCrystals >= GAME_CONSTANTS.HERO_POWER_COST && !this.gameOver;
        const enemyCanUse = (this.currentPlayer === this.enemy) && !this.heroPowerUsed.enemy && this.enemy.manaCrystals >= GAME_CONSTANTS.HERO_POWER_COST && !this.gameOver;
        
        playerBtn.disabled = !playerCanUse;
        enemyBtn.disabled = !enemyCanUse;
        
        // 清除所有高亮
        playerBtn.classList.remove('ring-2', 'ring-secondary');
        enemyBtn.classList.remove('ring-2', 'ring-secondary');
        
        // 只有可用的技能才高亮
        if (playerCanUse) {
            playerBtn.classList.add('ring-2', 'ring-secondary');
        }
        if (enemyCanUse) {
            enemyBtn.classList.add('ring-2', 'ring-secondary');
        }
        
        playerBtn.title = `${this.player.heroClass.name}技能：${this.player.heroClass.skill}`;
        enemyBtn.title = `${this.enemy.heroClass.name}技能：${this.enemy.heroClass.skill}`;
        playerBtn.innerHTML = `<span class="inline-block w-7 h-7 rounded-full bg-secondary/80 text-primary font-bold flex items-center justify-center text-lg">2</span>`;
        enemyBtn.innerHTML = `<span class="inline-block w-7 h-7 rounded-full bg-secondary/80 text-primary font-bold flex items-center justify-center text-lg">2</span>`;
    },
    
    updateHeroAvatars() {
        const playerAvatar = document.querySelector('.player-hero-avatar');
        const enemyAvatar = document.querySelector('.enemy-hero-avatar');
        
        playerAvatar.innerHTML = GameUtils.getHeroAvatar(this.player.heroClass);
        enemyAvatar.innerHTML = GameUtils.getHeroAvatar(this.enemy.heroClass);
        
        // 清除所有英雄的高亮状态
        playerAvatar.classList.remove('ring-4', 'ring-yellow-400', 'cursor-pointer');
        enemyAvatar.classList.remove('ring-4', 'ring-yellow-400', 'cursor-pointer');
        playerAvatar.onclick = null;
        enemyAvatar.onclick = null;
        
        // 只有当前回合的玩家英雄可以攻击时才高亮
        if (this.currentPlayer === this.player && this.player.heroCanAttack && !this.player.heroAttacked && this.player.heroAttack > 0 && !this.gameOver) {
            playerAvatar.classList.add('ring-4', 'ring-yellow-400', 'cursor-pointer');
            playerAvatar.onclick = () => this.selectHeroAttack(true);
        } else if (this.currentPlayer === this.enemy && this.enemy.heroCanAttack && !this.enemy.heroAttacked && this.enemy.heroAttack > 0 && !this.gameOver) {
            enemyAvatar.classList.add('ring-4', 'ring-yellow-400', 'cursor-pointer');
            enemyAvatar.onclick = () => this.selectHeroAttack(false);
        }
    }
});
