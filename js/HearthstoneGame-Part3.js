// 炉石传说游戏主类 - 第三部分（随从战斗和UI更新）
// 这个文件需要在HearthstoneGame-Part2.js之后加载

Object.assign(HearthstoneGame.prototype, {
    // 随从区域和手牌UI更新
    updateMinionBoard(elementId, minions, isPlayer) {
        const boardElement = document.getElementById(elementId);
        
        // 清空现有内容，但保留死亡动画中的元素
        const existingElements = Array.from(boardElement.children);
        existingElements.forEach(el => {
            if (!el.classList.contains('death-fade')) {
                boardElement.removeChild(el);
            }
        });
        
        if (minions.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'text-center text-gray-400 w-full py-4';
            emptyMessage.textContent = isPlayer ? '你暂无随从' : '对手暂无随从';
            boardElement.appendChild(emptyMessage);
            return;
        }
        
        minions.forEach((minion, index) => {
            const minionElement = document.createElement('div');
            let className = `bg-card rounded-lg p-3 w-28 flex flex-col items-center justify-between shadow-lg border border-gray-700 relative card-hover battlefield-minion animate-play`;
            
            // 为潜行随从添加特效
            if (minion.stealth) {
                className += ' stealth-effect';
            }
            
            minionElement.className = className;
            minionElement.dataset.index = index;
            minionElement.dataset.id = minion.id;
            
            const specialEffects = GameUtils.getEffectsText(minion, true);
            const attackedMark = minion.hasAttacked ?
                '<div class="absolute top-1 right-1 text-gray-500"><i class="fa fa-lock"></i></div>' : '';
            
            minionElement.innerHTML = `
                ${attackedMark}
                <div class="font-bold text-center text-base mb-2">${minion.name}</div>
                <div class="text-sm text-gray-300 mb-2">${specialEffects}</div>
                <div class="flex justify-between w-full mt-auto">
                    <span class="bg-red-800/70 px-2 rounded text-base font-semibold">${minion.attack}</span>
                    <span class="bg-green-800/70 px-2 rounded text-base font-semibold">${minion.health}</span>
                </div>
            `;
            
            // 只有当前回合的玩家的随从才有高亮和点击效果，且不在法术选择状态
            if (((isPlayer && this.currentPlayer === this.player) || (!isPlayer && this.currentPlayer === this.enemy)) && !this.selectedSpell) {
                // 可以攻击的随从添加高亮边框
                if (!minion.hasAttacked && minion.attack > 0) {
                    className += ' ring-2 ring-green-400';
                }
                minionElement.addEventListener('click', () => this.selectMinion(index, minion));
            }
            boardElement.appendChild(minionElement);
        });
    },

    updateHand(elementId, hand, isEnemy = false) {
        const handElement = document.getElementById(elementId);
        handElement.innerHTML = '';
        
        if (hand.length === 0) {
            handElement.innerHTML = `<div class="text-center text-gray-400 w-full py-6">${isEnemy ? '对手暂无手牌' : '没有手牌'}</div>`;
            return;
        }
        
        hand.forEach((card, index) => {
            const cardElement = document.createElement('div');
            const currentPlayerCanPlay = (isEnemy && this.currentPlayer === this.enemy) || (!isEnemy && this.currentPlayer === this.player);
            const canPlay = isEnemy ? (card.cost <= this.enemy.manaCrystals) : (card.cost <= this.player.manaCrystals);
            const shouldHighlight = currentPlayerCanPlay && canPlay;
            const opacity = shouldHighlight ? 'opacity-100' : 'opacity-50';
            
            if (card instanceof Minion) {
                cardElement.className = `bg-card rounded-lg p-2 w-24 flex flex-col items-center justify-between shadow-lg border ${shouldHighlight ? 'border-secondary ring-2 ring-secondary' : 'border-gray-700'} relative card-hover ${opacity} ${!currentPlayerCanPlay ? 'opacity-60' : ''}`;
                cardElement.dataset.index = index;
                
                const specialEffects = GameUtils.getEffectsText(card, true);
                cardElement.innerHTML = `
                    <div class="absolute top-1 right-1 bg-secondary/80 text-primary rounded-full w-5 h-5 flex items-center justify-center text-sm font-bold">
                        ${card.cost}
                    </div>
                    <div class="font-bold text-center text-sm mt-4 mb-1">${card.name}</div>
                    <div class="text-xs text-gray-300 mb-1">${specialEffects}</div>
                    <div class="flex justify-between w-full mt-2">
                        <span class="bg-red-800/70 px-1.5 rounded text-sm">${card.attack}</span>
                        <span class="bg-green-800/70 px-1.5 rounded text-sm">${card.health}</span>
                    </div>
                `;
            } else if (card instanceof Weapon) {
                cardElement.className = `bg-amber-700 rounded-lg p-2 w-28 flex flex-col items-center justify-between shadow-lg border ${shouldHighlight ? 'border-amber-400 ring-2 ring-amber-400' : 'border-gray-700'} relative card-hover ${opacity} ${!currentPlayerCanPlay ? 'opacity-60' : ''}`;
                cardElement.dataset.index = index;
                cardElement.innerHTML = `
                    <div class="absolute top-1 right-1 bg-secondary/80 text-primary rounded-full w-5 h-5 flex items-center justify-center text-sm font-bold">
                        ${card.cost}
                    </div>
                    <i class="fa fa-gavel text-amber-200 text-2xl mt-4 mb-2"></i>
                    <div class="font-bold text-center text-sm mb-1 text-amber-100">${card.name}</div>
                    <div class="text-xs text-amber-300 mb-1">武器</div>
                    <div class="flex justify-between w-full mt-2">
                        <span class="bg-red-800/70 px-1.5 rounded text-sm">${card.attack}</span>
                        <span class="bg-blue-800/70 px-1.5 rounded text-sm">${card.durability}</span>
                    </div>
                `;
            } else if (card instanceof Spell) {
                cardElement.className = `bg-purple-700 rounded-lg p-2 w-28 flex flex-col items-center justify-between shadow-lg border ${shouldHighlight ? 'border-purple-400 ring-2 ring-purple-400' : 'border-gray-700'} relative card-hover ${opacity} ${!currentPlayerCanPlay ? 'opacity-60' : ''}`;
                cardElement.dataset.index = index;
                cardElement.innerHTML = `
                    <div class="absolute top-1 right-1 bg-secondary/80 text-primary rounded-full w-5 h-5 flex items-center justify-center text-sm font-bold">
                        ${card.cost}
                    </div>
                    <i class="fa fa-magic text-purple-200 text-2xl mt-4 mb-2"></i>
                    <div class="font-bold text-center text-sm mb-1 text-purple-100">${card.name}</div>
                    <div class="text-xs text-purple-300 mb-1">法术</div>
                    <div class="text-xs text-purple-200 text-center mt-2 leading-tight">${card.description}</div>
                `;
            }
            
            // 只有当前回合的玩家且可以使用的卡牌才能点击
            if (shouldHighlight) {
                cardElement.addEventListener('click', () => this.playPlayerCard(index, isEnemy));
            }
            handElement.appendChild(cardElement);
        });
    },

    // 战斗相关方法
    selectMinion(index, minion) {
        // 如果正在选择法术目标，阻止随从选择
        if (this.selectedSpell) {
            return;
        }
        
        if (minion.hasAttacked) {
            this.logMessage(`${minion.name}本回合已经攻击过了`);
            return;
        }
        if (minion.attack === 0) {
            this.logMessage(`${minion.name}攻击力为0，无法进行攻击`);
            return;
        }
        
        this.clearSelection();
        this.selectedMinion = { index, minion };
        
        const minionElements = document.querySelectorAll(
            this.currentPlayer === this.player ? '#player-minions > div' : '#enemy-minions > div'
        );
        minionElements[index].classList.add('ring-2', 'ring-secondary', 'scale-110');
        this.highlightAttackTargets();
        this.addCancelAttackListener();
    },

    highlightAttackTargets() {
        const attackerIsPlayer = this.currentPlayer === this.player;
        const enemyBoard = attackerIsPlayer ? this.enemy.board : this.player.board;
        const enemyMinionElements = document.querySelectorAll(
            attackerIsPlayer ? '#enemy-minions > div' : '#player-minions > div'
        );
        
        // 过滤出可攻击的随从（不包括潜行随从）
        const attackableMinions = enemyBoard.filter(m => !m.stealth);
        const tauntMinions = attackableMinions.filter(m => m.taunt);
        const canAttackHero = tauntMinions.length === 0;
        
        if (enemyBoard.length > 0) {
            enemyMinionElements.forEach((el, index) => {
                const minion = enemyBoard[index];
                // 潜行随从无法被选为目标
                if (!minion.stealth && (minion.taunt || tauntMinions.length === 0)) {
                    el.classList.add('ring-2', 'ring-red-500', 'cursor-pointer');
                    // 使用 { once: true } 确保事件只执行一次，执行后自动移除
                    el.addEventListener('click', () => this.attackTarget('minion', index), { once: true });
                }
            });
        }
        
        if (canAttackHero) {
            // 检查当前选中随从是否为rush且为出场回合，若是则不高亮也不绑定点击
            let selectedMinion = this.selectedMinion && this.selectedMinion.minion;
            let isRushFirstTurn = selectedMinion && selectedMinion.rush && selectedMinion.summonTurn === (window._game ? window._game.turnCount : 1);
            if (isRushFirstTurn) {
                // 突袭随从出场回合不能攻击英雄，直接返回，不高亮也不绑定
                return;
            }
            
            const enemyHeroAvatar = document.querySelector(
                attackerIsPlayer ? '.enemy-hero-avatar' : '.player-hero-avatar'
            );
            if (enemyHeroAvatar) {
                enemyHeroAvatar.classList.add('ring-4', 'ring-red-500', 'cursor-pointer');
                // 使用 { once: true } 确保事件只执行一次，执行后自动移除
                enemyHeroAvatar.addEventListener('click', () => this.attackTarget('hero', 0), { once: true });
            }
        }
    },

    attackTarget(type, index) {
        if (!this.selectedMinion) return;
        
        const attackerIsPlayer = this.currentPlayer === this.player;
        let target;
        if (type === 'minion') {
            target = attackerIsPlayer ? this.enemy.board[index] : this.player.board[index];
        } else {
            target = attackerIsPlayer ? this.enemy : this.player;
        }

        // 先验证攻击是否有效，避免播放无效的攻击动画
        const attackResult = this.currentPlayer.attackWithMinion(
            this.selectedMinion.index,
            target
        );
        
        if (!attackResult.success) {
            // 攻击无效，显示错误信息并清除选择
            this.logMessage(attackResult.reason || "攻击无效");
            this.clearSelection();
            return;
        }

        // 获取攻击者和目标元素
        const attackerBoard = document.querySelector(attackerIsPlayer ? '#player-minions' : '#enemy-minions');
        const attackerElement = attackerBoard.children[this.selectedMinion.index];
        let targetElement;
        
        if (type === 'minion') {
            const targetBoard = document.querySelector(attackerIsPlayer ? '#enemy-minions' : '#player-minions');
            targetElement = targetBoard.children[index];
        } else {
            targetElement = document.querySelector(attackerIsPlayer ? '.enemy-hero-avatar' : '.player-hero-avatar');
        }

        // 只有攻击成功才播放攻击动画
        this.playAttackAnimation(attackerElement, targetElement, () => {
            // 播放受击动画
            this.playHitAnimation(targetElement);

            let needsUIUpdate = true;

            if (target instanceof Minion) {
                this.logMessage(`${this.selectedMinion.minion.name}攻击了${target.name}`);
                if (attackResult.targetDied) {
                    this.logMessage(`${target.name}被消灭了，进入弃牌堆`);
                    // 播放目标死亡动画
                    this.playDeathAnimation(targetElement, () => {
                        if (needsUIUpdate) {
                            this.updateGameUI();
                            needsUIUpdate = false;
                        }
                    });
                }
                if (attackResult.attackerDied) {
                    this.logMessage(`${this.selectedMinion.minion.name}被消灭了，进入弃牌堆`);
                    // 播放攻击者死亡动画
                    this.playDeathAnimation(attackerElement, () => {
                        if (needsUIUpdate) {
                            this.updateGameUI();
                            needsUIUpdate = false;
                        }
                    });
                }
                if (!attackResult.targetDied && !attackResult.attackerDied) {
                    this.updateGameUI();
                    needsUIUpdate = false;
                }
            } else {
                this.logMessage(`${this.selectedMinion.minion.name}攻击了${attackerIsPlayer ? '对手' : '你'}英雄，造成${attackResult.damageDealt}点伤害`);
                this.updateGameUI();
                needsUIUpdate = false;
            }
            
            if (attackResult.attackerDied) {
                this.selectedMinion = null;
            }
            this.clearSelection();
            this.checkGameOver();
        });
    },

    playPlayerCard(index, isEnemy = false) {
        const actor = isEnemy ? this.enemy : this.player;
        const card = actor.hand[index];
        const success = actor.playCard(index);
        
        if (success) {
            if (success.spellCast) {
                const spell = success.spell;
                if (success.needsTarget) {
                    // 需要目标选择的法术
                    this.selectedSpell = { spell: spell, caster: actor, cardIndex: success.cardIndex };
                    this.highlightSpellTargets(actor);
                    this.logMessage(`选择${spell.name}的目标`);
                } else {
                    // 群体法术，直接施放
                    const result = spell.cast(actor, null, this);
                    if (result.success) {
                        this.logMessage(`${actor.name}施放了${spell.name}`);
                    } else {
                        this.logMessage(`${spell.name}施放失败：${result.reason || "未知原因"}`);
                    }
                    this.updateGameUI();
                }
            } else {
                this.logMessage(`${actor.name}打出了: ${card.name}`);
                this.updateGameUI();
            }
        }
    }
});
