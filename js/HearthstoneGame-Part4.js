// 炉石传说游戏主类 - 第四部分（事件监听和英雄技能）
// 这个文件需要在HearthstoneGame-Part3.js之后加载

Object.assign(HearthstoneGame.prototype, {
    // 选择和清理相关方法
    clearSelection() {
        this.selectedMinion = null;
        this.selectedHero = null; // 清除英雄选择
        // 不要在这里清除 this.selectedSpell，它应该由专门的取消法术方法处理
        this.removeCancelAttackListener(); // 移除全局点击监听器
        
        // 清除攻击相关高亮
        document.querySelectorAll('#player-minions > div').forEach(el => {
            el.classList.remove('ring-2', 'ring-secondary', 'scale-110');
        });
        document.querySelectorAll('#enemy-minions > div').forEach(el => {
            el.classList.remove('ring-2', 'ring-secondary', 'scale-110');
            el.classList.remove('ring-2', 'ring-red-500', 'cursor-pointer');
            el.classList.remove('ring-2', 'ring-yellow-400', 'cursor-pointer'); // 清除英雄攻击高亮
            el.classList.remove('ring-2', 'ring-purple-500', 'cursor-pointer'); // 清除法术目标高亮
        });
        document.querySelectorAll('#player-minions > div').forEach(el => {
            el.classList.remove('ring-2', 'ring-red-500', 'cursor-pointer');
            el.classList.remove('ring-2', 'ring-yellow-400', 'cursor-pointer'); // 清除英雄攻击高亮
            el.classList.remove('ring-2', 'ring-purple-500', 'cursor-pointer'); // 清除法术目标高亮
        });
        
        const enemyHeroAvatar = document.querySelector('.enemy-hero-avatar');
        if (enemyHeroAvatar) {
            enemyHeroAvatar.classList.remove('ring-4', 'ring-red-500', 'cursor-pointer');
            enemyHeroAvatar.classList.remove('ring-4', 'ring-yellow-400', 'cursor-pointer'); // 清除英雄攻击高亮
            enemyHeroAvatar.classList.remove('ring-4', 'ring-purple-500', 'cursor-pointer'); // 清除法术目标高亮
        }
        const playerHeroAvatar = document.querySelector('.player-hero-avatar');
        if (playerHeroAvatar) {
            playerHeroAvatar.classList.remove('ring-4', 'ring-red-500', 'cursor-pointer');
            playerHeroAvatar.classList.remove('ring-4', 'ring-yellow-400', 'cursor-pointer'); // 清除英雄攻击高亮
            playerHeroAvatar.classList.remove('ring-4', 'ring-purple-500', 'cursor-pointer'); // 清除法术目标高亮
        }
        
        // 重新更新UI以确保事件监听器正确重置
        this.updateGameUI();
    },
    
    // 添加取消攻击的全局点击监听器
    addCancelAttackListener() {
        // 移除之前的监听器（如果存在）
        this.removeCancelAttackListener();
        
        this.cancelAttackHandler = (event) => {
            // 检查是否有选中的攻击单位
            if (!this.selectedMinion && !this.selectedHero) {
                return;
            }
            
            // 检查点击是否在有效目标上
            const isHeroAvatar = event.target.closest('.enemy-hero-avatar, .player-hero-avatar');
            const isMinionCard = event.target.closest('#enemy-minions > div, #player-minions > div');
            const isValidTarget = isHeroAvatar || isMinionCard;
            
            // 如果点击了有效目标，不取消选择（让原有的攻击逻辑处理）
            if (isValidTarget) {
                return;
            }
            
            // 检查是否点击了UI按钮或其他交互元素
            const isUIElement = event.target.closest('button, .hand-area, #game-log, .hero-power');
            
            // 如果点击的不是有效目标且不是UI元素，取消攻击选择
            if (!isUIElement) {
                this.clearSelection();
            }
        };
        
        // 使用捕获阶段，确保在其他点击事件之前执行
        document.addEventListener('click', this.cancelAttackHandler, true);
    },
    
    // 移除取消攻击的全局点击监听器
    removeCancelAttackListener() {
        if (this.cancelAttackHandler) {
            document.removeEventListener('click', this.cancelAttackHandler, true);
            this.cancelAttackHandler = null;
        }
    },

    // 初始化所有按钮事件监听
    initEventListeners() {
        document.getElementById('new-game').addEventListener('click', () => {
            this.showGameModeSelection();
        });
        
        document.getElementById('restart-game').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('end-turn').addEventListener('click', () => {
            if (!this.gameOver && this.gameMode !== 'vs-ai') {
                this.endTurn();
            } else if (!this.gameOver && this.gameMode === 'vs-ai' && this.currentPlayer === this.player) {
                this.endTurn();
            }
        });
        
        document.getElementById('help').addEventListener('click', () => {
            document.getElementById('help-modal').classList.remove('hidden');
        });
        
        document.getElementById('close-help').addEventListener('click', () => {
            document.getElementById('help-modal').classList.add('hidden');
        });
        
        document.getElementById('play-again').addEventListener('click', () => {
            this.restartGame();
        });
        
        // 统一英雄技能按钮事件
        const skillBtnHandler = (isPlayer) => {
            const actor = isPlayer ? this.player : this.enemy;
            const used = isPlayer ? this.heroPowerUsed.player : this.heroPowerUsed.enemy;
            if (this.currentPlayer === actor && !used && actor.manaCrystals >= GAME_CONSTANTS.HERO_POWER_COST && !this.gameOver && this.turnCount > 1) {
                const handler = HERO_SKILL_HANDLERS[actor.heroClass.key];
                if (handler) {
                    handler(this, actor, isPlayer);
                } else {
                    this.logMessage('该职业技能暂未开放');
                }
            }
        };
        
        document.getElementById('player-hero-power').addEventListener('click', () => skillBtnHandler(true));
        document.getElementById('enemy-hero-power').addEventListener('click', () => skillBtnHandler(false));
    },

    // 法师技能：选择目标
    enableMageSkillTarget(isPlayerMage) {
        const actor = isPlayerMage ? this.player : this.enemy;
        const heroAvatars = [
            document.querySelector('.player-hero-avatar'),
            document.querySelector('.enemy-hero-avatar')
        ];
        
        heroAvatars.forEach((avatar, idx) => {
            if (avatar) {
                avatar.classList.add('ring-4', 'ring-blue-400', 'cursor-pointer');
                const handler = () => {
                    this.useMageSkill(isPlayerMage, idx === 0 ? this.player : this.enemy);
                };
                avatar.addEventListener('click', handler, { once: true });
                if (!this.mageSkillHeroHandlers) this.mageSkillHeroHandlers = [];
                this.mageSkillHeroHandlers.push({ avatar, handler });
            }
        });
        
        const ownBoard = isPlayerMage ? this.player.board : this.enemy.board;
        const ownMinionElements = document.querySelectorAll(isPlayerMage ? '#player-minions > div' : '#enemy-minions > div');
        const enemyBoard = isPlayerMage ? this.enemy.board : this.player.board;
        const enemyMinionElements = document.querySelectorAll(isPlayerMage ? '#enemy-minions > div' : '#player-minions > div');
        
        this.mageSkillMinionHandlers = [];
        
        ownBoard.forEach((minion, idx) => {
            const el = ownMinionElements[idx];
            if (el) {
                el.classList.add('ring-2', 'ring-blue-400', 'cursor-pointer');
                const handler = () => {
                    this.useMageSkill(isPlayerMage, minion);
                };
                el.addEventListener('click', handler, { once: true });
                this.mageSkillMinionHandlers.push({ el, handler });
            }
        });
        
        enemyBoard.forEach((minion, idx) => {
            const el = enemyMinionElements[idx];
            if (el) {
                el.classList.add('ring-2', 'ring-blue-400', 'cursor-pointer');
                const handler = () => {
                    this.useMageSkill(isPlayerMage, minion);
                };
                el.addEventListener('click', handler, { once: true });
                this.mageSkillMinionHandlers.push({ el, handler });
            }
        });
    },

    // 法师技能：对目标造成伤害
    useMageSkill(isPlayerMage, target) {
        const actor = isPlayerMage ? this.player : this.enemy;
        actor.manaCrystals -= GAME_CONSTANTS.HERO_POWER_COST;
        
        if (target instanceof Minion) {
            let hadDivineShield = target.divineShield;
            target.takeDamage(1);
            if (hadDivineShield) {
                this.logMessage(`${target.name}的圣盾抵挡了伤害，圣盾被移除`);
            } else {
                this.logMessage(`${actor.name}使用了法师技能，对${actor === this.player ? '对手' : '你'}的${target.name}造成1点伤害`);
            }
            
            if (target.health <= 0) {
                this.logMessage(`${target.name}被消灭了，进入弃牌堆`);
                const board = actor === this.player ? this.enemy.board : this.player.board;
                const graveyard = actor === this.player ? this.enemy.graveyard : this.player.graveyard;
                const idx = board.indexOf(target);
                if (idx !== -1) {
                    const deadMinion = board.splice(idx, 1)[0];
                    graveyard.push(deadMinion);
                }
            }
        } else {
            target.takeDamage(1);
            this.logMessage(`${actor.name}使用了法师技能，对${actor === this.player ? '对手' : '你'}英雄造成1点伤害`);
        }
        
        if (isPlayerMage) {
            this.heroPowerUsed.player = true;
        } else {
            this.heroPowerUsed.enemy = true;
        }
        
        this.clearMageSkillTarget();
        this.updateGameUI();
        this.checkGameOver();
    },

    // 清除法师技能目标选择
    clearMageSkillTarget() {
        if (this.mageSkillHeroHandlers) {
            this.mageSkillHeroHandlers.forEach(({ avatar, handler }) => {
                avatar.classList.remove('ring-4', 'ring-blue-400', 'cursor-pointer');
                avatar.replaceWith(avatar.cloneNode(true));
            });
            this.mageSkillHeroHandlers = null;
        }
        
        if (this.mageSkillMinionHandlers) {
            this.mageSkillMinionHandlers.forEach(({ el, handler }) => {
                el.classList.remove('ring-2', 'ring-blue-400', 'cursor-pointer');
                el.replaceWith(el.cloneNode(true));
            });
            this.mageSkillMinionHandlers = null;
        }
    },

    // 牧师技能：选择目标
    enablePriestSkillTarget(isPlayerPriest) {
        this.clearPriestSkillTarget();
        const actor = isPlayerPriest ? this.player : this.enemy;
        const targetBoard = isPlayerPriest ? this.enemy.board : this.player.board;
        const ownBoard = isPlayerPriest ? this.player.board : this.enemy.board;
        const targetHeroAvatar = document.querySelector(isPlayerPriest ? '.enemy-hero-avatar' : '.player-hero-avatar');
        const ownHeroAvatar = document.querySelector(isPlayerPriest ? '.player-hero-avatar' : '.enemy-hero-avatar');

        if (targetHeroAvatar) {
            targetHeroAvatar.classList.add('ring-4', 'ring-green-400', 'cursor-pointer');
            this.priestSkillHeroHandler1 = () => {
                this.usePriestSkill(isPlayerPriest, isPlayerPriest ? this.enemy : this.player);
            };
            targetHeroAvatar.addEventListener('click', this.priestSkillHeroHandler1, { once: true });
        }
        
        if (ownHeroAvatar) {
            ownHeroAvatar.classList.add('ring-4', 'ring-green-400', 'cursor-pointer');
            this.priestSkillHeroHandler2 = () => {
                this.usePriestSkill(isPlayerPriest, actor);
            };
            ownHeroAvatar.addEventListener('click', this.priestSkillHeroHandler2, { once: true });
        }
        
        const targetMinionElements = document.querySelectorAll(isPlayerPriest ? '#enemy-minions > div' : '#player-minions > div');
        this.priestSkillMinionHandlers = [];
        
        targetBoard.forEach((minion, idx) => {
            const el = targetMinionElements[idx];
            if (el) {
                el.classList.add('ring-2', 'ring-green-400', 'cursor-pointer');
                const handler = () => {
                    this.usePriestSkill(isPlayerPriest, minion);
                };
                el.addEventListener('click', handler, { once: true });
                this.priestSkillMinionHandlers.push({ el, handler });
            }
        });
        
        const ownMinionElements = document.querySelectorAll(isPlayerPriest ? '#player-minions > div' : '#enemy-minions > div');
        ownBoard.forEach((minion, idx) => {
            const el = ownMinionElements[idx];
            if (el) {
                el.classList.add('ring-2', 'ring-green-400', 'cursor-pointer');
                const handler = () => {
                    this.usePriestSkill(isPlayerPriest, minion);
                };
                el.addEventListener('click', handler, { once: true });
                this.priestSkillMinionHandlers.push({ el, handler });
            }
        });
    },

    // 牧师技能：治疗目标
    usePriestSkill(isPlayerPriest, target) {
        const actor = isPlayerPriest ? this.player : this.enemy;
        actor.manaCrystals -= GAME_CONSTANTS.HERO_POWER_COST;
        
        if (target instanceof Minion) {
            const before = target.health;
            target.heal(2);
            const after = target.health;
            this.logMessage(`${actor.name}使用了牧师技能，为${target.name}恢复了${after - before}点生命值`);
        } else {
            const before = target.health;
            target.heal(2);
            const after = target.health;
            this.logMessage(`${actor.name}使用了牧师技能，为${target === actor ? '自己' : (actor === this.player ? '对手' : '你')}英雄恢复了${after - before}点生命值`);
        }
        
        if (isPlayerPriest) {
            this.heroPowerUsed.player = true;
        } else {
            this.heroPowerUsed.enemy = true;
        }
        
        this.clearPriestSkillTarget();
        this.updateGameUI();
        this.checkGameOver();
    },

    // 清除牧师技能目标选择
    clearPriestSkillTarget() {
        const enemyHeroAvatar = document.querySelector('.enemy-hero-avatar');
        if (enemyHeroAvatar) {
            enemyHeroAvatar.classList.remove('ring-4', 'ring-green-400', 'cursor-pointer');
            enemyHeroAvatar.replaceWith(enemyHeroAvatar.cloneNode(true));
            this.priestSkillHeroHandler1 = null;
        }
        
        const playerHeroAvatar = document.querySelector('.player-hero-avatar');
        if (playerHeroAvatar) {
            playerHeroAvatar.classList.remove('ring-4', 'ring-green-400', 'cursor-pointer');
            playerHeroAvatar.replaceWith(playerHeroAvatar.cloneNode(true));
            this.priestSkillHeroHandler2 = null;
        }
        
        if (this.priestSkillMinionHandlers) {
            this.priestSkillMinionHandlers.forEach(({ el, handler }) => {
                el.classList.remove('ring-2', 'ring-green-400', 'cursor-pointer');
                el.replaceWith(el.cloneNode(true));
            });
            this.priestSkillMinionHandlers = null;
        }
    },
    
    // 法术目标选择相关方法
    highlightSpellTargets(caster) {
        // 高亮所有可能的目标（敌方英雄和所有随从）
        const isPlayer = caster === this.player;
        
        // 高亮敌方英雄
        const enemyHeroAvatar = document.querySelector(isPlayer ? '.enemy-hero-avatar' : '.player-hero-avatar');
        if (enemyHeroAvatar) {
            enemyHeroAvatar.classList.add('ring-4', 'ring-purple-500', 'cursor-pointer');
            // 敌方英雄：如果施法者是玩家，目标就是敌人(false)；如果施法者是敌人，目标就是玩家(true)
            enemyHeroAvatar.addEventListener('click', () => this.spellTargetHero(!isPlayer), { once: true });
        }
        
        // 高亮己方英雄
        const friendlyHeroAvatar = document.querySelector(isPlayer ? '.player-hero-avatar' : '.enemy-hero-avatar');
        if (friendlyHeroAvatar) {
            friendlyHeroAvatar.classList.add('ring-4', 'ring-purple-500', 'cursor-pointer');
            // 友方英雄：如果施法者是玩家，目标就是玩家(true)；如果施法者是敌人，目标就是敌人(false)
            friendlyHeroAvatar.addEventListener('click', () => this.spellTargetHero(isPlayer), { once: true });
        }
        
        // 高亮所有随从
        const allMinionElements = document.querySelectorAll('#player-minions > div, #enemy-minions > div');
        allMinionElements.forEach((el, index) => {
            el.classList.add('ring-2', 'ring-purple-500', 'cursor-pointer');
            
            // 确定随从属于哪个玩家
            const isPlayerMinion = el.closest('#player-minions') !== null;
            const owner = isPlayerMinion ? this.player : this.enemy;
            const minionIndex = Array.from(el.parentElement.children).indexOf(el);
            
            el.addEventListener('click', () => this.spellTargetMinion(owner, minionIndex), { once: true });
        });
        
        this.addCancelSpellListener();
    },
    
    spellTargetHero(isPlayerTarget) {
        const targetPlayer = isPlayerTarget ? this.player : this.enemy;
        const target = { type: 'hero', player: targetPlayer };
        this.castSpellOnTarget(target);
    },
    
    spellTargetMinion(owner, minionIndex) {
        if (minionIndex < 0 || minionIndex >= owner.board.length) {
            return;
        }
        const minion = owner.board[minionIndex];
        const target = { type: 'minion', minion: minion, owner: owner };
        this.castSpellOnTarget(target);
    },
    
    castSpellOnTarget(target) {
        if (!this.selectedSpell) {
            return;
        }
        
        const { spell, caster, cardIndex } = this.selectedSpell;
        
        // 如果是火球术，播放特殊的飞行特效
        if (spell.name.includes('火球')) {
            this.createFireballEffect(spell, caster, target, () => {
                // 特效完成后执行实际的法术效果
                this.executeSpellAfterEffect(spell, caster, cardIndex, target);
            });
        } else {
            // 其他法术直接执行
            this.executeSpellAfterEffect(spell, caster, cardIndex, target);
        }
    },
    
    executeSpellAfterEffect(spell, caster, cardIndex, target) {
        // 先消耗法力值
        caster.manaCrystals -= spell.cost;
        
        // 从手牌中移除法术牌
        caster.hand.splice(cardIndex, 1);
        
        // 施放法术
        const result = spell.cast(caster, target, this);
        if (result.success) {
            this.logMessage(`${caster.name}施放了${spell.name}`);
        } else {
            this.logMessage(`${spell.name}施放失败：${result.reason || "未知原因"}`);
        }
        
        // 清理选择状态
        this.selectedSpell = null;
        this.clearSpellTargetHighlights();
        this.updateGameUI();
        this.checkGameOver();
    },
    
    createFireballEffect(spell, caster, target, callback) {
        // 获取施法者位置
        const isPlayerCaster = caster === this.player;
        const casterElement = document.querySelector(isPlayerCaster ? '.player-hero-avatar' : '.enemy-hero-avatar');
        
        // 获取目标位置
        let targetElement;
        if (target.type === 'hero') {
            const isPlayerTarget = target.player === this.player;
            targetElement = document.querySelector(isPlayerTarget ? '.player-hero-avatar' : '.enemy-hero-avatar');
        } else if (target.type === 'minion') {
            const isPlayerMinion = target.owner === this.player;
            const minionIndex = target.owner.board.indexOf(target.minion);
            const selector = isPlayerMinion ? '#player-minions > div' : '#enemy-minions > div';
            targetElement = document.querySelectorAll(selector)[minionIndex];
        }
        
        if (!casterElement || !targetElement) {
            // 如果找不到元素，直接执行callback
            callback();
            return;
        }
        
        // 计算起始和结束位置
        const casterRect = casterElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();
        
        const startX = casterRect.left + casterRect.width / 2;
        const startY = casterRect.top + casterRect.height / 2;
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;
        
        // 创建火球元素
        const fireball = document.createElement('div');
        fireball.innerHTML = '🔥';
        fireball.className = 'fireball-projectile';
        fireball.style.left = startX + 'px';
        fireball.style.top = startY + 'px';
        fireball.style.color = '#FF6B35';
        
        // 计算飞行路径
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        
        // 设置CSS变量用于动画
        fireball.style.setProperty('--flight-x-20', (deltaX * 0.2) + 'px');
        fireball.style.setProperty('--flight-y-20', (deltaY * 0.2 - 10) + 'px');
        fireball.style.setProperty('--flight-x-40', (deltaX * 0.4) + 'px');
        fireball.style.setProperty('--flight-y-40', (deltaY * 0.4 - 15) + 'px');
        fireball.style.setProperty('--flight-x-60', (deltaX * 0.6) + 'px');
        fireball.style.setProperty('--flight-y-60', (deltaY * 0.6 - 10) + 'px');
        fireball.style.setProperty('--flight-x-80', (deltaX * 0.8) + 'px');
        fireball.style.setProperty('--flight-y-80', (deltaY * 0.8 - 5) + 'px');
        fireball.style.setProperty('--flight-x-100', deltaX + 'px');
        fireball.style.setProperty('--flight-y-100', deltaY + 'px');
        
        // 添加到页面
        document.body.appendChild(fireball);
        
        // 在动画结束后创建撞击特效并执行回调
        setTimeout(() => {
            // 移除飞行的火球
            if (fireball.parentNode) {
                fireball.parentNode.removeChild(fireball);
            }
            
            // 在目标位置创建撞击特效
            this.createFireballImpactEffect(targetElement);
            
            // 执行实际的法术效果
            callback();
        }, 800);
    },
    
    createFireballImpactEffect(targetElement) {
        if (!targetElement) return;
        
        const impact = document.createElement('div');
        impact.innerHTML = '💥';
        impact.className = 'fireball-impact';
        impact.style.position = 'absolute';
        impact.style.top = '50%';
        impact.style.left = '50%';
        impact.style.transform = 'translate(-50%, -50%)';
        impact.style.pointerEvents = 'none';
        impact.style.zIndex = '1001';
        impact.style.fontSize = '28px';
        impact.style.color = '#FF4500';
        impact.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        
        targetElement.style.position = 'relative';
        targetElement.appendChild(impact);
        
        setTimeout(() => {
            if (impact.parentNode) {
                impact.parentNode.removeChild(impact);
            }
        }, 600);
    },
    
    addCancelSpellListener() {
        const cancelHandler = (e) => {
            // 如果点击的是UI界面的其他区域（不是目标），取消法术选择
            if (e.target.closest('#player-minions') || e.target.closest('#enemy-minions') || 
                e.target.closest('.player-hero-avatar') || e.target.closest('.enemy-hero-avatar')) {
                return; // 点击的是有效目标，不取消
            }
            
            this.cancelSpellSelection();
            document.removeEventListener('click', cancelHandler);
        };
        
        // 延迟添加监听器，避免立即触发
        setTimeout(() => {
            document.addEventListener('click', cancelHandler);
        }, 100);
    },
    
    cancelSpellSelection() {
        if (this.selectedSpell) {
            this.logMessage("取消法术施放");
            // 取消时不消耗法力值，因为法力值还没有被扣除
            this.selectedSpell = null;
            this.clearSpellTargetHighlights();
            this.updateGameUI(); // 重新绑定正常的随从选择事件
        }
    },
    
    // 清除法术目标高亮
    clearSpellTargetHighlights() {
        // 清除所有法术目标高亮
        document.querySelectorAll('#player-minions > div, #enemy-minions > div').forEach(el => {
            el.classList.remove('ring-2', 'ring-purple-500', 'cursor-pointer');
        });
        
        document.querySelectorAll('.player-hero-avatar, .enemy-hero-avatar').forEach(el => {
            el.classList.remove('ring-4', 'ring-purple-500', 'cursor-pointer');
        });
    }
});
