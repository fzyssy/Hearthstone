// AI 决策系统
class HearthstoneAI {
    constructor(game) {
        this.game = game;
        this.aiPlayer = game.enemy;
        this.humanPlayer = game.player;
    }

    // AI执行回合
    async executeAITurn() {
        if (this.game.gameOver || this.game.currentPlayer !== this.aiPlayer) {
            return;
        }

    this.game.isAITurn = true;
    this.game.updateGameUI(); // 立即更新UI显示AI行动中状态
    await this.sleep(this.game.aiThinkingTime);
    // 执行AI决策流程
    await this.playTurn();
    this.game.isAITurn = false;
    this.game.updateGameUI(); // AI行动结束后立即更新UI
    }

    // AI回合决策主流程 - 动态决策系统
    async playTurn() {
        let totalActionsExecuted = 0;
        const maxIterations = 20; // 防止无限循环
        let iteration = 0;
        // 使用循环进行动态决策，每次行动后重新评估
        while (iteration < maxIterations && !this.game.gameOver && this.game.currentPlayer === this.aiPlayer) {
            iteration++;
            // 扫描当前回合可以进行的所有操作
            const availableActions = this.scanAvailableActions();
            const totalActions = availableActions.playCard.length + availableActions.heroSkill.length + availableActions.attacks.length;
            if (totalActions === 0) {
                break; // 没有更多操作可执行
            }
            let actionExecuted = false;
            // 优先级1：执行出牌操作
            if (availableActions.playCard.length > 0) {
                const executed = await this.executePlayCardPhase(availableActions.playCard);
                if (executed > 0) {
                    actionExecuted = true;
                    totalActionsExecuted += executed;
                    continue; // 出牌后重新评估
                }
            }
            // 优先级2：使用英雄技能
            if (availableActions.heroSkill.length > 0) {
                const executed = await this.executeHeroSkillPhase(availableActions.heroSkill);
                if (executed > 0) {
                    actionExecuted = true;
                    totalActionsExecuted += executed;
                    continue; // 使用技能后重新评估（可能抽到新牌）
                }
            }
            // 优先级3：在攻击前使用随从buff法术
            const buffSpellsBeforeAttack = this.getBuffSpellsBeforeAttack();
            if (buffSpellsBeforeAttack.length > 0) {
                const executed = await this.executeBuffSpellsBeforeAttack(buffSpellsBeforeAttack);
                if (executed > 0) {
                    actionExecuted = true;
                    totalActionsExecuted += executed;
                    continue; // 使用buff后重新评估
                }
            }
            // 优先级4：执行攻击
            if (availableActions.attacks.length > 0) {
                const executed = await this.executeAttackPhase(availableActions.attacks);
                if (executed > 0) {
                    actionExecuted = true;
                    totalActionsExecuted += executed;
                    // 攻击后通常不需要重新评估出牌，但继续循环以防万一
                }
            }
            // 如果没有执行任何操作，退出循环
            if (!actionExecuted) {
                break;
            }
        }
        // 结束回合
        if (!this.game.gameOver && this.game.currentPlayer === this.aiPlayer) {
            await this.sleep(500);
            this.game.endTurn();
        }
    }

    // 扫描当前回合可以进行的所有操作
    scanAvailableActions() {
        const actions = {
            playCard: [],
            heroSkill: [],
            attacks: []
        };
        
        // 扫描出牌操作
        this.scanPlayCardActions(actions.playCard);
        
        // 扫描英雄技能操作
        this.scanHeroSkillActions(actions.heroSkill);
        
        // 扫描攻击操作
        this.scanAttackActions(actions.attacks);
        
        return actions;
    }
    
    // 扫描出牌操作
    scanPlayCardActions(playCardActions) {
        this.aiPlayer.hand.forEach((card, index) => {
            if (card.cost <= this.aiPlayer.manaCrystals) {
                if (card instanceof Minion && this.aiPlayer.board.length < 7) {
                    playCardActions.push({
                        type: 'play_minion',
                        cardIndex: index,
                        card: card,
                        cost: card.cost,
                        priority: this.calculateMinionPlayPriority(card)
                    });
                } else if (card instanceof Weapon) {
                    playCardActions.push({
                        type: 'play_weapon',
                        cardIndex: index,
                        card: card,
                        cost: card.cost,
                        priority: this.calculateWeaponPlayPriority(card)
                    });
                } else if (card instanceof Spell) {
                    const targets = this.getSpellTargets(card);
                    if (targets.length > 0) {
                        targets.forEach(target => {
                            const priority = this.calculateSpellPlayPriority(card, target);
                            if (priority > 0) { // 只添加有意义的法术行动
                                playCardActions.push({
                                    type: 'play_spell',
                                    cardIndex: index,
                                    card: card,
                                    target: target,
                                    cost: card.cost,
                                    priority: priority
                                });
                            }
                        });
                    }
                }
            }
        });
    }
    
    // 扫描英雄技能操作
    scanHeroSkillActions(heroSkillActions) {
        if (this.aiPlayer.manaCrystals >= 2 && !this.game.heroPowerUsed.enemy) {
            const targets = this.getHeroPowerTargets();
            if (targets.length > 0) {
                targets.forEach(target => {
                    const priority = this.calculateHeroSkillPriority(target);
                    if (priority > 0) {
                        heroSkillActions.push({
                            type: 'hero_power',
                            target: target,
                            cost: 2,
                            priority: priority
                        });
                    }
                });
            }
        }
    }
    
    // 扫描攻击操作
    scanAttackActions(attackActions) {
        // 英雄攻击
        if (this.aiPlayer.heroCanAttack && !this.aiPlayer.heroAttacked && this.aiPlayer.heroAttack > 0) {
            const targets = this.getValidAttackTargets(null, this.humanPlayer);
            targets.forEach(target => {
                attackActions.push({
                    type: 'hero_attack',
                    target: target,
                    damage: this.aiPlayer.heroAttack,
                    priority: this.calculateAttackPriority(null, target)
                });
            });
        }

        // 随从攻击
        this.aiPlayer.board.forEach((minion, index) => {
            if (!minion.hasAttacked && minion.attack > 0) {
                const targets = this.getValidAttackTargets(minion, this.humanPlayer);
                targets.forEach(target => {
                    attackActions.push({
                        type: 'minion_attack',
                        minionIndex: index,
                        minion: minion,
                        target: target,
                        damage: minion.attack,
                        priority: this.calculateAttackPriority(minion, target)
                    });
                });
            }
        });
    }
    
    // 执行出牌阶段 - 按照高费到低费，智能选择
    async executePlayCardPhase(playCardActions) {
        if (playCardActions.length === 0) return 0;
        // 按费用从高到低排序，相同费用按优先级排序
        playCardActions.sort((a, b) => {
            if (a.cost !== b.cost) {
                return b.cost - a.cost; // 高费优先
            }
            return b.priority - a.priority; // 相同费用按优先级
        });
        // 智能出牌逻辑 - 不处理buff法术，留到攻击前使用
        const executedActions = [];
        for (const action of playCardActions) {
            if (this.game.gameOver || this.game.currentPlayer !== this.aiPlayer) {
                break;
            }
            // 检查是否还有足够法力值
            if (this.aiPlayer.manaCrystals < action.cost) {
                continue;
            }
            // 检查斩杀机会
            const canLethal = this.checkLethalOpportunity();
            if (canLethal && !this.isLethalAction(action)) {
                continue; // 有斩杀机会时优先斩杀
            }
            // 跳过buff类法术，留到攻击前使用
            if (this.isBuffSpell(action)) {
                continue;
            }
            // 智能过滤不合理的行动
            if (!this.shouldExecuteAction(action)) {
                continue;
            }
            await this.executeAction(action);
            executedActions.push(action);
            await this.sleep(800);
        }
        return executedActions.length;
    }
    
    // 执行英雄技能阶段
    async executeHeroSkillPhase(heroSkillActions) {
        if (heroSkillActions.length === 0) return 0;
        // 选择最佳的英雄技能使用方案
        heroSkillActions.sort((a, b) => b.priority - a.priority);
        for (const action of heroSkillActions) {
            if (this.game.gameOver || this.game.currentPlayer !== this.aiPlayer) {
                break;
            }
            if (this.aiPlayer.manaCrystals >= action.cost && !this.game.heroPowerUsed.enemy) {
                // 智能判断是否应该使用技能
                if (this.shouldUseHeroSkill(action)) {
                    await this.executeAction(action);
                    await this.sleep(800);
                    return 1; // 英雄技能每回合只能用一次，返回1表示执行了一个操作
                }
            }
        }
        return 0; // 没有使用技能
    }
    
    // 执行攻击阶段
    async executeAttackPhase(initialAttackActions) {
        // 重新扫描所有可以攻击的随从（包括刚召唤的冲锋/突袭随从）
        const currentAttackActions = [];
        this.scanAttackActions(currentAttackActions);
        if (currentAttackActions.length === 0) {
            return 0;
        }
        // 按攻击优先级排序
        currentAttackActions.sort((a, b) => b.priority - a.priority);
        // 逐一执行攻击，每次攻击后重新验证
        let attackCount = 0;
        for (const action of currentAttackActions) {
            if (this.game.gameOver || this.game.currentPlayer !== this.aiPlayer) {
                break;
            }
            // 重新验证攻击的有效性（可能在前一次攻击后状态发生变化）
            if (this.isValidAttack(action)) {
                await this.executeAction(action);
                attackCount++;
                await this.sleep(800);
                // 如果游戏结束（比如击杀了对手），立即停止
                if (this.game.gameOver) {
                    break;
                }
            }
        }
        return attackCount;
    }

    // 智能判断函数集合
    
    // 检查是否有斩杀机会
    checkLethalOpportunity() {
        let totalDamage = 0;
        
        // 计算场上所有能攻击的单位总伤害
        if (this.aiPlayer.heroCanAttack && !this.aiPlayer.heroAttacked && this.aiPlayer.heroAttack > 0) {
            totalDamage += this.aiPlayer.heroAttack;
        }
        
        this.aiPlayer.board.forEach(minion => {
            if (!minion.hasAttacked && minion.attack > 0) {
                totalDamage += minion.attack;
            }
        });
        
        // 计算手牌中直伤法术的伤害
        this.aiPlayer.hand.forEach(card => {
            if (card instanceof Spell && card.cost <= this.aiPlayer.manaCrystals) {
                if (card.name.includes("火球术")) totalDamage += 6;
                else if (card.name.includes("闪电箭") || card.name.includes("奥术飞弹")) totalDamage += 3;
                else if (card.name.includes("暗影箭")) totalDamage += 4;
                else if (card.name.includes("熔岩爆裂")) totalDamage += 5;
            }
        });
        
        // 加上英雄技能伤害
        if (!this.game.heroPowerUsed.enemy && this.aiPlayer.manaCrystals >= 2) {
            const skillKey = this.aiPlayer.heroClass.key;
            if (skillKey === 'mage') totalDamage += 1;
            else if (skillKey === 'hunter') totalDamage += 2;
        }
        
        return totalDamage >= this.humanPlayer.health;
    }
    
    // 判断是否为斩杀行动
    isLethalAction(action) {
        if (action.type === 'play_spell') {
            const spell = action.card;
            if (action.target === this.humanPlayer) {
                // 直伤法术对英雄
                return spell.name.includes("火球术") || spell.name.includes("闪电箭") || 
                       spell.name.includes("奥术飞弹") || spell.name.includes("暗影箭") ||
                       spell.name.includes("熔岩爆裂");
            }
        }
        return action.type === 'hero_attack' || action.type === 'minion_attack';
    }
    
    // 判断是否为buff法术
    isBuffSpell(action) {
        if (action.type !== 'play_spell') return false;
        
        const spellName = action.card.name;
        // 专门针对"玉莲印记"和其他随从buff法术
        return spellName.includes("玉莲印记") || spellName.includes("祝福") || 
               spellName.includes("强化") || spellName.includes("增益") ||
               spellName.includes("加血") || spellName.includes("加攻") ||
               (action.card.targetType === "all_minions" && (action.card.buffAttack > 0 || action.card.buffHealth > 0));
    }
    
    // 判断是否应该延后使用buff法术 - 不再使用这个方法，改为在攻击前使用
    shouldDelayBuffSpell(action) {
        // 如果没有随从在场，延后使用
        if (this.aiPlayer.board.length === 0) {
            return true;
        }
        
        // 如果还有随从牌可以出，延后使用
        const hasMoreMinions = this.aiPlayer.hand.some(card => 
            card instanceof Minion && card.cost <= this.aiPlayer.manaCrystals - action.cost
        );
        
        return hasMoreMinions;
    }
    
    // 判断是否应该执行该行动
    shouldExecuteAction(action) {
        // 火球术不要打自己的目标
        if (action.type === 'play_spell' && action.card.name.includes("火球术")) {
            if (action.target === this.aiPlayer || 
                (action.target instanceof Minion && this.aiPlayer.board.includes(action.target))) {
                return false;
            }
        }
        
        // 治疗法术智能使用
        if (action.type === 'play_spell' && action.card.name.includes("治疗")) {
            if (action.target === this.humanPlayer) {
                return false; // 不治疗敌人
            }
            if (action.target === this.aiPlayer && this.aiPlayer.health >= this.aiPlayer.maxHealth - 1) {
                return false; // 血量接近满血时不浪费治疗
            }
        }
        
        return true;
    }
    
    // 判断是否应该使用英雄技能
    shouldUseHeroSkill(action) {
        const skillKey = this.aiPlayer.heroClass.key;
        
        // 法师技能：不要打自己的目标
        if (skillKey === 'mage') {
            if (action.target === this.aiPlayer || 
                (action.target instanceof Minion && this.aiPlayer.board.includes(action.target))) {
                return false;
            }
        }
        
        // 牧师技能：不要治疗敌人满血目标
        if (skillKey === 'priest') {
            if (action.target === this.humanPlayer && this.humanPlayer.health >= this.humanPlayer.maxHealth) {
                return false;
            }
            if (action.target instanceof Minion && !this.aiPlayer.board.includes(action.target)) {
                return false; // 不治疗敌方随从
            }
        }
        
        // 如果剩余法力值不多，优先留给出牌
        if (this.aiPlayer.manaCrystals <= 3) {
            const hasPlayableCards = this.aiPlayer.hand.some(card => 
                card.cost <= this.aiPlayer.manaCrystals - 2
            );
            if (hasPlayableCards) {
                return false;
            }
        }
        
        return true;
    }
    
    // 验证攻击是否有效
    isValidAttack(action) {
        if (action.type === 'hero_attack') {
            return this.aiPlayer.heroCanAttack && !this.aiPlayer.heroAttacked && 
                   this.aiPlayer.heroAttack > 0;
        } else if (action.type === 'minion_attack') {
            const minion = action.minion;
            return minion && !minion.hasAttacked && minion.attack > 0 &&
                   this.aiPlayer.board.includes(minion);
        }
        return false;
    }
    
    // 获取攻击前应该使用的buff法术
    getBuffSpellsBeforeAttack() {
        const buffSpells = [];
        
        // 只有当场上有随从时才考虑使用buff法术
        if (this.aiPlayer.board.length === 0) {
            return buffSpells;
        }
        
        // 检查是否有可攻击的随从
        const hasAttackableMinions = this.aiPlayer.board.some(minion => 
            minion.canAttack && !minion.attackedThisTurn
        );
        
        // 只有在有可攻击随从的情况下才使用buff法术
        if (!hasAttackableMinions) {
            return buffSpells;
        }
        
        // 扫描手牌中的buff法术
        this.aiPlayer.hand.forEach((card, index) => {
            if (card instanceof Spell && this.isBuffSpell({ type: 'play_spell', card: card })) {
                if (card.cost <= this.aiPlayer.manaCrystals) {
                    const targets = this.getSpellTargets(card);
                    if (targets.length > 0) {
                        targets.forEach(target => {
                            const priority = this.calculateSpellPlayPriority(card, target);
                            if (priority > 0) {
                                buffSpells.push({
                                    type: 'play_spell',
                                    cardIndex: index,
                                    card: card,
                                    target: target,
                                    cost: card.cost,
                                    priority: priority
                                });
                            }
                        });
                    }
                }
            }
        });
        
        return buffSpells;
    }
    
    // 执行攻击前的buff法术
    async executeBuffSpellsBeforeAttack(buffSpells) {
        if (buffSpells.length === 0) return 0;
        
        this.game.logMessage("AI在攻击前使用增益法术...");
        
        // 按优先级排序buff法术
        buffSpells.sort((a, b) => b.priority - a.priority);
        
        let executedCount = 0;
        for (const action of buffSpells) {
            if (this.game.gameOver || this.game.currentPlayer !== this.aiPlayer) {
                break;
            }
            
            if (this.aiPlayer.manaCrystals >= action.cost) {
                // 再次检查是否应该执行该action
                if (this.shouldExecuteAction(action)) {
                    await this.executeAction(action);
                    executedCount++;
                    await this.sleep(800);
                }
            }
        }
        
        return executedCount;
    }
    
    // 执行buff法术
    async executeBuffSpells(buffSpells) {
        if (buffSpells.length === 0) return 0;
        
        // 只有当场上有随从时才使用buff
        if (this.aiPlayer.board.length > 0) {
            this.game.logMessage("AI使用增益法术...");
            
            // 按优先级排序buff法术
            buffSpells.sort((a, b) => b.priority - a.priority);
            
            let executedCount = 0;
            for (const action of buffSpells) {
                if (this.game.gameOver || this.game.currentPlayer !== this.aiPlayer) {
                    break;
                }
                
                if (this.aiPlayer.manaCrystals >= action.cost) {
                    await this.executeAction(action);
                    executedCount++;
                    await this.sleep(800);
                }
            }
            
            return executedCount;
        }
        
        return 0;
    }

    // 重新设计的优先级计算函数
    
    // 计算随从出牌优先级
    calculateMinionPlayPriority(card) {
        let priority = 0;
        
        // 基础优先级：高费用随从优先级更高
        priority = card.cost * 20 + card.attack * 5 + card.health * 3;
        
        // 特殊能力加成
        if (card.taunt) priority += 60; // 嘲讽在控场时很重要
        if (card.charge) priority += 80; // 冲锋可以立即攻击
        if (card.rush) priority += 50;
        if (card.divineShield) priority += 40;
        if (card.lifesteal) priority += 30;
        if (card.windfury) priority += 70;
        
        // 场面状况调整
        if (this.aiPlayer.board.length === 0) {
            priority += 100; // 空场时随从非常重要
        } else if (this.aiPlayer.board.length <= 2) {
            priority += 50; // 随从数量少时需要补充
        }
        
        // 对抗性调整
        if (this.humanPlayer.board.length >= 3 && card.taunt) {
            priority += 80; // 对手随从多时嘲讽更重要
        }
        
        return priority;
    }
    
    // 计算武器装备优先级
    calculateWeaponPlayPriority(card) {
        let priority = 0;
        
        // 基础优先级
        priority = card.attack * 25 + card.durability * 15;
        
        // 如果没有武器，大幅提高优先级
        if (!this.aiPlayer.weapon) {
            priority += 150;
        } else {
            // 如果新武器更好
            const currentWeapon = this.aiPlayer.weapon;
            if (card.attack > currentWeapon.attack || card.durability > currentWeapon.durability) {
                priority += 80;
            } else {
                priority -= 50; // 新武器不如当前武器，降低优先级
            }
        }
        
        return priority;
    }
    
    // 计算法术使用优先级
    calculateSpellPlayPriority(card, target) {
        let priority = 0;
        const spellName = card.name;
        
        // 直伤法术
        if (spellName.includes("火球术") || spellName.includes("闪电箭") || 
            spellName.includes("奥术飞弹") || spellName.includes("暗影箭") ||
            spellName.includes("熔岩爆裂")) {
            
            let damage = 0;
            if (spellName.includes("火球术")) damage = 6;
            else if (spellName.includes("闪电箭") || spellName.includes("奥术飞弹")) damage = 3;
            else if (spellName.includes("暗影箭")) damage = 4;
            else if (spellName.includes("熔岩爆裂")) damage = 5;
            
            if (target === this.humanPlayer) {
                priority = 200 + damage * 10;
                // 斩杀机会
                if (target.health <= damage) {
                    priority += 1000;
                }
                // 低血量时优先攻击英雄
                if (target.health <= 10) {
                    priority += 100;
                }
            } else if (target instanceof Minion && !this.aiPlayer.board.includes(target)) {
                // 攻击敌方随从
                if (target.health <= damage) {
                    priority = 300 + target.attack * 10 + target.health * 5;
                    // 优先清理威胁性随从
                    if (target.taunt) priority += 100;
                    if (target.charge) priority += 80;
                    if (target.windfury) priority += 60;
                } else {
                    priority = 100 + Math.min(damage, target.health) * 5;
                }
            } else {
                // 不攻击自己的单位
                return 0;
            }
        }
        // 治疗法术
        else if (spellName.includes("治疗") || spellName.includes("圣光")) {
            if (target === this.aiPlayer) {
                const missingHealth = this.aiPlayer.maxHealth - this.aiPlayer.health;
                if (missingHealth >= 3) {
                    priority = 80 + missingHealth * 10;
                }
            } else if (target instanceof Minion && this.aiPlayer.board.includes(target)) {
                const missingHealth = target.maxHealth - target.health;
                if (missingHealth >= 2) {
                    priority = 60 + missingHealth * 5 + target.attack * 5;
                }
            }
        }
        // Buff法术
        else if (this.isBuffSpell({type: 'play_spell', card: card})) {
            if (target instanceof Minion && this.aiPlayer.board.includes(target)) {
                priority = 50 + target.attack * 8; // 给攻击力高的随从buff更有价值
            }
        }
        // 清场法术
        else if (spellName.includes("风暴") || spellName.includes("清场") || spellName.includes("奉献")) {
            const enemyMinionCount = this.humanPlayer.board.filter(m => m.health <= 2).length;
            if (enemyMinionCount >= 2) {
                priority = 250 + enemyMinionCount * 50;
            } else {
                priority = 50;
            }
        }
        // 其他法术
        else {
            priority = 80;
        }
        
        return priority;
    }
    
    // 计算英雄技能优先级
    calculateHeroSkillPriority(target) {
        let priority = 0;
        const skillKey = this.aiPlayer.heroClass.key;
        
        if (skillKey === 'mage') {
            if (target === this.humanPlayer) {
                priority = 50;
                if (target.health <= 1) {
                    priority += 500; // 斩杀机会
                }
            } else if (target instanceof Minion && !this.aiPlayer.board.includes(target)) {
                if (target.health <= 1) {
                    priority = 100 + target.attack * 5;
                } else {
                    priority = 30;
                }
            } else {
                return 0; // 不攻击自己的单位
            }
        } else if (skillKey === 'hunter') {
            priority = 60;
            if (this.humanPlayer.health <= 2) {
                priority += 500;
            }
        } else if (skillKey === 'priest') {
            if (target === this.aiPlayer) {
                const missingHealth = this.aiPlayer.maxHealth - this.aiPlayer.health;
                if (missingHealth >= 2) {
                    priority = 40 + missingHealth * 10;
                }
            } else if (target instanceof Minion && this.aiPlayer.board.includes(target)) {
                const missingHealth = target.maxHealth - target.health;
                if (missingHealth >= 2) {
                    priority = 35 + missingHealth * 8;
                }
            }
        } else {
            // 其他职业
            priority = 40;
        }
        
        return priority;
    }
    
    // 计算攻击优先级
    calculateAttackPriority(attacker, target) {
        let priority = 0;
        const damage = attacker ? attacker.attack : this.aiPlayer.heroAttack;
        
        if (target === this.humanPlayer) {
            // 攻击敌方英雄
            priority = 150 + damage * 10;
            
            // 斩杀机会最高优先级
            if (target.health <= damage) {
                priority += 2000;
            }
            
            // 低血量时提高优先级
            if (target.health <= 8) {
                priority += 150;
            }
        } else if (target instanceof Minion) {
            // 攻击随从
            if (target.health <= damage) {
                // 能直接消灭
                priority = 400 + target.attack * 15 + target.health * 8;
                
                // 威胁性随从优先清理
                if (target.taunt) priority += 200;
                if (target.charge) priority += 150;
                if (target.windfury) priority += 120;
                if (target.divineShield) priority += 100;
                if (target.lifesteal) priority += 80;
            } else {
                // 不能直接消灭，考虑交换价值
                priority = 100 + Math.min(damage, target.health) * 8;
                
                // 嘲讽必须攻击
                if (target.taunt) {
                    priority += 300;
                }
                
                // 评估交换是否有利
                if (attacker) {
                    if (target.attack >= attacker.health) {
                        // 不利交换
                        if (attacker.attack + attacker.health > target.attack + target.health) {
                            priority += 50; // 数值交换有利
                        } else {
                            priority -= 100; // 数值交换不利
                        }
                    } else {
                        // 有利交换
                        priority += 100;
                    }
                }
            }
        }
        
        return priority;
    }

    // 执行具体行动
    async executeAction(action) {
        try {
            // 在执行前再次检查法力值，确保不会变成负数
            if (action.cost && this.aiPlayer.manaCrystals < action.cost) {
                console.log(`AI跳过行动：法力值不足 (需要${action.cost}，当前${this.aiPlayer.manaCrystals})`);
                return;
            }

            switch (action.type) {
                case 'hero_attack':
                    await this.executeHeroAttack(action);
                    break;
                case 'minion_attack':
                    await this.executeMinionAttack(action);
                    break;
                case 'hero_power':
                    await this.executeHeroPower(action);
                    break;
                case 'play_minion':
                    await this.executePlayMinion(action);
                    break;
                case 'play_weapon':
                    await this.executePlayWeapon(action);
                    break;
                case 'play_spell':
                    await this.executePlaySpell(action);
                    break;
            }
        } catch (error) {
            console.error('AI执行行动时出错:', error);
        }
    }

    // 执行英雄攻击
    async executeHeroAttack(action) {
        return new Promise((resolve) => {
            // 获取攻击者和目标元素
            const attackerElement = document.querySelector('.enemy-hero-avatar');
            let targetElement;
            
            if (action.target === this.humanPlayer) {
                targetElement = document.querySelector('.player-hero-avatar');
                
                // 执行攻击逻辑
                const result = this.aiPlayer.attackWithHero(this.humanPlayer);
                if (result.success) {
                    // 播放攻击动画
                    this.game.playAttackAnimation(attackerElement, targetElement, () => {
                        // 播放受击动画
                        this.game.playHitAnimation(targetElement);
                        
                        this.game.logMessage(`AI英雄攻击了你，造成${result.damageDealt}点伤害`);
                        this.game.updateGameUI();
                        this.game.checkGameOver();
                        resolve();
                    });
                } else {
                    resolve();
                }
            } else {
                // 攻击对方随从
                const targetIndex = this.humanPlayer.board.indexOf(action.target);
                if (targetIndex !== -1) {
                    const targetBoard = document.querySelector('#player-minions');
                    targetElement = targetBoard.children[targetIndex];
                    
                    const result = this.aiPlayer.attackWithHero(action.target);
                    if (result.success) {
                        // 播放攻击动画
                        this.game.playAttackAnimation(attackerElement, targetElement, () => {
                            // 播放受击动画
                            this.game.playHitAnimation(targetElement);
                            
                            this.game.logMessage(`AI英雄攻击了你的${action.target.name}`);
                            
                            let needsUIUpdate = true;
                            
                            // 如果随从死亡，播放死亡动画
                            if (result.targetDied) {
                                const deadMinion = this.humanPlayer.board.splice(targetIndex, 1)[0];
                                this.humanPlayer.graveyard.push(deadMinion);
                                this.game.logMessage(`你的${action.target.name}被消灭了`);
                                
                                this.game.playDeathAnimation(targetElement, () => {
                                    if (needsUIUpdate) {
                                        this.game.updateGameUI();
                                        needsUIUpdate = false;
                                    }
                                    resolve();
                                });
                            } else {
                                this.game.updateGameUI();
                                needsUIUpdate = false;
                                resolve();
                            }
                            
                            // 如果AI英雄死亡（理论上不太可能，但为了完整性）
                            if (result.heroDied) {
                                this.game.logMessage(`AI英雄死亡了`);
                                this.game.checkGameOver();
                            }
                        });
                    } else {
                        resolve();
                    }
                } else {
                    resolve();
                }
            }
        });
    }

    // 执行随从攻击
    async executeMinionAttack(action) {
        return new Promise((resolve) => {
            const attacker = action.minion;
            const target = action.target;
            
            // 获取攻击者元素
            const attackerBoard = document.querySelector('#enemy-minions');
            const attackerElement = attackerBoard.children[action.minionIndex];
            let targetElement;
            
            if (target === this.humanPlayer) {
                // 攻击对方英雄
                targetElement = document.querySelector('.player-hero-avatar');
                
                const result = this.aiPlayer.attackWithMinion(action.minionIndex, this.humanPlayer);
                if (result.success) {
                    // 播放攻击动画
                    this.game.playAttackAnimation(attackerElement, targetElement, () => {
                        // 播放受击动画
                        this.game.playHitAnimation(targetElement);
                        
                        this.game.logMessage(`AI的${attacker.name}攻击了你，造成${result.damageDealt}点伤害`);
                        this.game.updateGameUI();
                        this.game.checkGameOver();
                        resolve();
                    });
                } else {
                    resolve();
                }
            } else {
                // 攻击对方随从
                const targetIndex = this.humanPlayer.board.indexOf(target);
                if (targetIndex !== -1) {
                    const targetBoard = document.querySelector('#player-minions');
                    targetElement = targetBoard.children[targetIndex];
                    
                    const result = this.aiPlayer.attackWithMinion(action.minionIndex, target);
                    if (result.success) {
                        // 播放攻击动画
                        this.game.playAttackAnimation(attackerElement, targetElement, () => {
                            // 播放受击动画
                            this.game.playHitAnimation(targetElement);
                            
                            this.game.logMessage(`AI的${attacker.name}攻击了你的${target.name}`);
                            
                            let needsUIUpdate = true;
                            let animationsComplete = 0;
                            const totalAnimations = (result.targetDied ? 1 : 0) + (result.attackerDied ? 1 : 0);
                            
                            const checkComplete = () => {
                                animationsComplete++;
                                if (animationsComplete >= totalAnimations || totalAnimations === 0) {
                                    if (needsUIUpdate) {
                                        this.game.updateGameUI();
                                        needsUIUpdate = false;
                                    }
                                    resolve();
                                }
                            };
                            
                            if (result.targetDied) {
                                this.game.logMessage(`你的${target.name}被消灭了`);
                                this.game.playDeathAnimation(targetElement, checkComplete);
                            }
                            
                            if (result.attackerDied) {
                                this.game.logMessage(`AI的${attacker.name}被消灭了`);
                                this.game.playDeathAnimation(attackerElement, checkComplete);
                            }
                            
                            if (totalAnimations === 0) {
                                checkComplete();
                            }
                        });
                    } else {
                        resolve();
                    }
                } else {
                    resolve();
                }
            }
        });
    }

    // 执行英雄技能
    async executeHeroPower(action) {
        return new Promise((resolve) => {
            // 再次检查法力值和技能使用状态
            if (this.aiPlayer.manaCrystals < GAME_CONSTANTS.HERO_POWER_COST || this.game.heroPowerUsed.enemy) {
                resolve();
                return;
            }

            const skillKey = this.aiPlayer.heroClass.key;
            const skillHandler = HERO_SKILL_HANDLERS[skillKey];
            
            if (!skillHandler) {
                resolve();
                return;
            }

            // 对于需要目标选择的技能，模拟选择过程
            if (skillKey === 'mage' || skillKey === 'priest') {
                // 模拟目标选择
                this.simulateTargetSkill(skillKey, action.target, resolve);
            } else {
                // 无需目标选择的技能，直接使用统一处理器
                const heroElement = document.querySelector('.enemy-hero-avatar');
                this.createHeroPowerEffect(skillKey, heroElement);
                
                setTimeout(() => {
                    skillHandler(this.game, this.aiPlayer, false);
                    resolve();
                }, 500);
            }
        });
    }
    
    // 模拟目标技能选择
    simulateTargetSkill(skillKey, target, resolve) {
        const heroElement = document.querySelector('.enemy-hero-avatar');
        this.createHeroPowerEffect(skillKey, heroElement);
        
        setTimeout(() => {
            if (skillKey === 'mage') {
                // 模拟法师技能目标选择
                this.game.useMageSkill(false, target);
            } else if (skillKey === 'priest') {
                // 模拟牧师技能目标选择  
                this.game.usePriestSkill(false, target);
            }
            resolve();
        }, 500);
    }
    
    // 创建英雄技能特效
    createHeroPowerEffect(skillKey, targetElement) {
        if (!targetElement) return;
        
        const effect = document.createElement('div');
        effect.style.position = 'absolute';
        effect.style.top = '50%';
        effect.style.left = '50%';
        effect.style.transform = 'translate(-50%, -50%)';
        effect.style.pointerEvents = 'none';
        effect.style.zIndex = '1001';
        effect.style.fontSize = '20px';
        effect.style.fontWeight = 'bold';
        effect.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        
        switch (skillKey) {
            case 'mage':
                effect.innerHTML = '🔥';
                effect.style.color = '#FF4444';
                effect.className = 'battle-spark';
                break;
            case 'priest':
                effect.innerHTML = '✨';
                effect.style.color = '#FFD700';
                effect.className = 'battle-spark';
                break;
            case 'warrior':
                effect.innerHTML = '🛡️';
                effect.style.color = '#888888';
                effect.className = 'battle-spark';
                break;
            case 'paladin':
                effect.innerHTML = '⚡';
                effect.style.color = '#FFD700';
                effect.className = 'battle-spark';
                break;
            default:
                effect.innerHTML = '✨';
                effect.style.color = '#4A90E2';
                effect.className = 'battle-spark';
                break;
        }
        
        targetElement.style.position = 'relative';
        targetElement.appendChild(effect);
        
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 600);
    }

    // 执行打出随从
    async executePlayMinion(action) {
        return new Promise((resolve) => {
            // 再次检查法力值
            if (this.aiPlayer.manaCrystals < action.card.cost) {
                console.log(`AI跳过召唤随从：法力值不足 (需要${action.card.cost}，当前${this.aiPlayer.manaCrystals})`);
                resolve();
                return;
            }

            const result = this.game.playPlayerCard(action.cardIndex, true);
            if (result) {
                this.game.logMessage(`AI召唤了${action.card.name}`);
                
                // 等待UI更新后添加动画
                setTimeout(() => {
                    const enemyMinionsContainer = document.querySelector('#enemy-minions');
                    const newMinionElement = enemyMinionsContainer.lastElementChild;
                    
                    if (newMinionElement) {
                        // 添加召唤动画
                        newMinionElement.classList.add('animate-play');
                        
                        // 创建召唤特效
                        this.createSummonEffect(newMinionElement);
                    }
                    
                    resolve();
                }, 100);
                
                this.game.updateGameUI();
            } else {
                resolve();
            }
        });
    }

    // 执行装备武器
    async executePlayWeapon(action) {
        return new Promise((resolve) => {
            // 再次检查法力值
            if (this.aiPlayer.manaCrystals < action.card.cost) {
                console.log(`AI跳过装备武器：法力值不足 (需要${action.card.cost}，当前${this.aiPlayer.manaCrystals})`);
                resolve();
                return;
            }

            const result = this.game.playPlayerCard(action.cardIndex, true);
            if (result) {
                this.game.logMessage(`AI装备了${action.card.name}`);
                
                // 为英雄添加装备特效
                const heroElement = document.querySelector('.enemy-hero-avatar');
                this.createWeaponEquipEffect(heroElement);
                
                this.game.updateGameUI();
                
                setTimeout(() => {
                    resolve();
                }, 600);
            } else {
                resolve();
            }
        });
    }

    // 执行施放法术
    async executePlaySpell(action) {
        return new Promise((resolve) => {
            // 再次检查法力值
            if (this.aiPlayer.manaCrystals < action.card.cost) {
                resolve();
                return;
            }

            const spell = action.card;
            const target = action.target;
            
            // 直接调用游戏的统一法术系统
            if (spell.targetType === "any") {
                // 需要目标选择的法术，模拟选择目标的过程
                this.simulateSpellTargetSelection(action, target, resolve);
            } else {
                // 群体法术，直接使用playPlayerCard
                this.game.playPlayerCard(action.cardIndex, true); // true表示AI出牌
                resolve();
            }
        });
    }
    
    // 模拟法术目标选择过程
    simulateSpellTargetSelection(action, target, resolve) {
        const spell = action.card;
        
        // 设置AI为当前施法者（模拟玩家选择法术后的状态）
        this.game.selectedSpell = { 
            spell: spell, 
            caster: this.aiPlayer, 
            cardIndex: action.cardIndex 
        };
        
        // 准备目标对象
        let spellTarget = null;
        if (target instanceof Minion) {
            // 确定随从的拥有者
            let owner = this.humanPlayer;
            if (this.aiPlayer.board.includes(target)) {
                owner = this.aiPlayer;
            }
            spellTarget = { type: 'minion', minion: target, owner: owner };
        } else {
            spellTarget = { type: 'hero', player: target };
        }
        
        // 直接调用统一的法术施放方法
        this.game.castSpellOnTarget(spellTarget);
        
        // 延迟一下让特效播放完
        setTimeout(() => {
            resolve();
        }, 1000);
    }

    // 获取有效攻击目标
    getValidAttackTargets(attacker, enemyPlayer) {
        const targets = [];
        const enemyTauntMinions = enemyPlayer.board.filter(m => m.taunt && !m.stealth && m.health > 0);
        
        if (enemyTauntMinions.length > 0) {
            // 有嘲讽随从时只能攻击嘲讽随从
            return enemyTauntMinions;
        }
        
        // 可攻击的随从（非潜行）
        const attackableMinions = enemyPlayer.board.filter(m => !m.stealth && m.health > 0);
        targets.push(...attackableMinions);
        
        // 检查是否可以攻击英雄
        // 突袭随从在召唤回合不能攻击英雄
        if (attacker && attacker.rush && attacker.summonTurn === this.game.turnCount) {
            // 突袭随从在召唤回合只能攻击随从，不能攻击英雄
            // targets 已经包含了可攻击的随从，不需要添加英雄
        } else {
            // 冲锋随从或普通随从可以攻击英雄
            targets.push(enemyPlayer);
        }
        
        return targets;
    }

    // 获取英雄技能目标
    getHeroPowerTargets() {
        const targets = [];
        const skillKey = this.aiPlayer.heroClass.key;
        
        if (skillKey === 'mage') {
            // 法师：可以指定任何目标
            targets.push(this.humanPlayer);
            targets.push(...this.humanPlayer.board.filter(m => m.health > 0));
            targets.push(...this.aiPlayer.board.filter(m => m.health > 0)); // 也可以打自己的随从（如果需要）
        } else if (skillKey === 'hunter') {
            // 猎人：只能攻击对方英雄
            targets.push(this.humanPlayer);
        } else if (skillKey === 'priest') {
            // 牧师：治疗任何目标
            targets.push(this.humanPlayer);
            targets.push(this.aiPlayer);
            targets.push(...this.humanPlayer.board.filter(m => m.health > 0));
            targets.push(...this.aiPlayer.board.filter(m => m.health > 0));
        } else if (skillKey === 'paladin' || skillKey === 'warrior' || skillKey === 'warlock' || 
                   skillKey === 'rogue' || skillKey === 'shaman' || skillKey === 'druid' || 
                   skillKey === 'deathknight') {
            // 这些职业不需要目标选择，返回null表示直接使用
            targets.push(null);
        } else {
            // 默认情况：攻击对方英雄
            targets.push(this.humanPlayer);
        }
        
        return targets;
    }

    // 获取法术目标
    getSpellTargets(spell) {
        const targets = [];
        
        if (spell.targetType === "any") {
            // 可以指定任何目标
            targets.push(this.humanPlayer);
            targets.push(this.aiPlayer);
            targets.push(...this.humanPlayer.board.filter(m => m.health > 0));
            targets.push(...this.aiPlayer.board.filter(m => m.health > 0));
        } else if (spell.targetType === "enemy") {
            // 只能指定敌方目标
            targets.push(this.humanPlayer);
            targets.push(...this.humanPlayer.board.filter(m => m.health > 0));
        } else {
            // 群体法术或无需目标
            targets.push(null);
        }
        
        return targets;
    }

    // 辅助方法：等待
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // 创建召唤特效
    createSummonEffect(targetElement) {
        if (!targetElement) return;
        
        const effect = document.createElement('div');
        effect.innerHTML = '✨';
        effect.style.position = 'absolute';
        effect.style.top = '50%';
        effect.style.left = '50%';
        effect.style.transform = 'translate(-50%, -50%)';
        effect.style.pointerEvents = 'none';
        effect.style.zIndex = '1001';
        effect.style.fontSize = '24px';
        effect.style.color = '#4A90E2';
        effect.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        effect.className = 'battle-spark';
        
        targetElement.style.position = 'relative';
        targetElement.appendChild(effect);
        
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 600);
    }
    
    // 创建武器装备特效
    createWeaponEquipEffect(targetElement) {
        if (!targetElement) return;
        
        const effect = document.createElement('div');
        effect.innerHTML = '⚔️';
        effect.style.position = 'absolute';
        effect.style.top = '50%';
        effect.style.left = '50%';
        effect.style.transform = 'translate(-50%, -50%)';
        effect.style.pointerEvents = 'none';
        effect.style.zIndex = '1001';
        effect.style.fontSize = '24px';
        effect.style.color = '#C9B037';
        effect.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        effect.className = 'battle-spark';
        
        targetElement.style.position = 'relative';
        targetElement.appendChild(effect);
        
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 600);
    }
    
    // 创建法术特效
    createSpellEffect(spell, targetElement) {
        if (!targetElement) return;
        
        const effect = document.createElement('div');
        effect.style.position = 'absolute';
        effect.style.top = '50%';
        effect.style.left = '50%';
        effect.style.transform = 'translate(-50%, -50%)';
        effect.style.pointerEvents = 'none';
        effect.style.zIndex = '1001';
        effect.style.fontSize = '20px';
        effect.style.fontWeight = 'bold';
        effect.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        effect.className = 'battle-spark';
        
        // 根据法术类型设置不同的特效
        if (spell.name.includes('火球') || spell.name.includes('奥术飞弹')) {
            effect.innerHTML = '🔥';
            effect.style.color = '#FF6B35';
        } else if (spell.name.includes('治疗') || spell.name.includes('圣光')) {
            effect.innerHTML = '💫';
            effect.style.color = '#FFD700';
        } else if (spell.name.includes('冰霜') || spell.name.includes('寒冰')) {
            effect.innerHTML = '❄️';
            effect.style.color = '#00BFFF';
        } else if (spell.name.includes('闪电') || spell.name.includes('雷击')) {
            effect.innerHTML = '⚡';
            effect.style.color = '#FFD700';
        } else {
            effect.innerHTML = '✨';
            effect.style.color = '#8A2BE2';
        }
        
        targetElement.style.position = 'relative';
        targetElement.appendChild(effect);
        
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 600);
    }
}
