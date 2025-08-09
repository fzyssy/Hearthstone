// 玩家类（包括敌人）
class Player {
    constructor(name, isPlayer = false, heroClass = null) {
        this.name = name;
        this.isPlayer = isPlayer; // 是否为玩家
        this.heroClass = heroClass || HERO_CLASSES[0]; // 职业
        this.health = GAME_CONSTANTS.STARTING_HEALTH; // 初始生命值
        this.manaCrystals = 0; // 当前法力
        this.maxManaCrystals = 0; // 最大法力
        this.hand = [];
        this.board = [];
        this.deck = [];
        this.graveyard = [];
        this.fatigue = 0;
        this.enemy = null;
        this.armor = 0;
        this.heroAttack = 0; // 英雄本回合攻击力
        this.heroCanAttack = false; // 英雄本回合是否可攻击
        this.heroAttacked = false; // 英雄本回合是否已攻击
        this.weapon = null; // 装备的武器
    }
    
    // 获得英雄攻击力
    gainHeroAttack(amount) {
        this.heroAttack += amount;
        if (this.heroAttack > 0) {
            this.heroCanAttack = true;
            this.heroAttacked = false;
        }
    }
    
    // 装备武器
    equipWeapon(weapon) {
        // 如果已有武器，将旧武器销毁
        if (this.weapon) {
            this.graveyard.push(this.weapon);
            if (window._game) {
                window._game.logMessage(`${this.name}的${this.weapon.name}被新武器替换并销毁`);
            }
        }
        this.weapon = weapon;
        this.updateHeroAttackFromWeapon();
        if (window._game) {
            window._game.logMessage(`${this.name}装备了${weapon.name}`);
        }
    }
    
    // 根据武器更新英雄攻击力
    updateHeroAttackFromWeapon() {
        // 这里只更新来自武器的攻击力，保留其他来源（如德鲁伊技能）的攻击力
        if (this.weapon) {
            // 如果有武器，至少有武器的攻击力
            if (this.heroAttack < this.weapon.attack) {
                this.heroAttack = this.weapon.attack;
            }
            this.heroCanAttack = true;
            // 如果还未攻击过，保持可攻击状态
        } else {
            // 没有武器时，只有在回合结束时才重置攻击力
            if (this.heroAttack <= 0) {
                this.heroCanAttack = false;
            }
        }
    }
    
    // 英雄攻击目标
    attackWithHero(target) {
        if (!this.heroCanAttack || this.heroAttacked || this.heroAttack <= 0) {
            return { success: false, reason: "英雄本回合无法攻击" };
        }
        
        // 嘲讽机制：有嘲讽随从时不能攻击英雄
        const enemyTauntMinions = this.enemy.board.filter(m => m.taunt && !m.stealth && m.health > 0);
        if (!(target instanceof Minion) && enemyTauntMinions.length > 0) {
            return { success: false, reason: "有嘲讽随从在场，必须先消灭嘲讽随从" };
        }
        
        let weaponDestroyed = false;
        if (target instanceof Minion) {
            let targetDied = target.takeDamage(this.heroAttack);
            let heroDied = this.takeDamage(target.attack);
            
            // 被攻击随从的吸血判定：如果被攻击的随从有吸血且造成了反伤，随从的控制者回血
            if (target.lifesteal && target.attack > 0) {
                this.enemy.heal(target.attack);
                window._game && window._game.logMessage(`${target.name}的吸血效果从反伤中为${this.enemy.name}恢复了${target.attack}点生命值`);
            }
            
            // 注意：剧毒效果不能对英雄生效，只能对随从生效
            // 所以这里不需要检查目标随从的剧毒效果
            
            this.heroAttacked = true;
            
            // 使用武器攻击后消耗耐久度
            if (this.weapon) {
                weaponDestroyed = this.weapon.useDurability();
                if (weaponDestroyed) {
                    this.graveyard.push(this.weapon);
                    if (window._game) {
                        window._game.logMessage(`${this.name}的${this.weapon.name}耐久度耗尽并被销毁`);
                    }
                    this.weapon = null;
                    this.updateHeroAttackFromWeapon();
                }
            }
            return { success: true, targetDied, heroDied, weaponDestroyed, damageDealt: this.heroAttack };
        } else {
            target.takeDamage(this.heroAttack);
            this.heroAttacked = true;
            
            // 使用武器攻击后消耗耐久度
            if (this.weapon) {
                weaponDestroyed = this.weapon.useDurability();
                if (weaponDestroyed) {
                    this.graveyard.push(this.weapon);
                    if (window._game) {
                        window._game.logMessage(`${this.name}的${this.weapon.name}耐久度耗尽并被销毁`);
                    }
                    this.weapon = null;
                    this.updateHeroAttackFromWeapon();
                }
            }
            return { success: true, targetDied: false, heroDied: false, weaponDestroyed, damageDealt: this.heroAttack };
        }
    }
    
    // 抽牌，若牌堆为空则疲劳
    drawCard() {
        if (this.deck.length > 0) {
            const card = this.deck.shift();
            this.hand.push(card);
            return card;
        } else {
            this.fatigue++;
            this.takeDamage(this.fatigue);
            if (window._game) {
                window._game.logMessage(`${this.name}因疲劳受到${this.fatigue}点伤害`);
            }
            return null;
        }
    }
    
    // 受到伤害，优先扣护甲
    takeDamage(amount) {
        let damage = amount;
        if (this.armor > 0) {
            if (damage <= this.armor) {
                this.armor -= damage;
                damage = 0;
            } else {
                damage -= this.armor;
                this.armor = 0;
            }
        }
        this.health -= damage;
        return this.health <= 0;
    }
    
    // 获得护甲
    gainArmor(amount) {
        this.armor += amount;
    }
    
    // 治疗
    heal(amount) {
        this.health = Math.min(GAME_CONSTANTS.STARTING_HEALTH, this.health + amount);
    }
    
    // 打出卡牌（支持随从、武器和法术）
    playCard(cardIndex) {
        if (cardIndex < 0 || cardIndex >= this.hand.length) {
            return false;
        }
        const card = this.hand[cardIndex];
        if (card.cost > this.manaCrystals) {
            return false;
        }
        
        if (card instanceof Minion) {
            this.manaCrystals -= card.cost;
            card.summonTurn = window._game ? window._game.turnCount : 1;
            card.windfuryAttacksLeft = card.windfury ? 2 : 1;
            this.board.push(card);
        } else if (card instanceof Weapon) {
            this.manaCrystals -= card.cost;
            this.equipWeapon(card);
        } else if (card instanceof Spell) {
            // 检查法术是否需要目标选择
            if (card.targetType === "any") {
                // 需要目标选择的法术，先不消耗法力值，等施放成功后再消耗
                return { spellCast: true, spell: card, needsTarget: true, cardIndex: cardIndex };
            } else {
                // 群体法术，直接施放
                this.manaCrystals -= card.cost;
                this.hand.splice(cardIndex, 1);
                return { spellCast: true, spell: card };
            }
        }
        this.hand.splice(cardIndex, 1);
        return true;
    }
    
    // 随从攻击目标（随从或英雄）
    attackWithMinion(minionIndex, target) {
        if (minionIndex < 0 || minionIndex >= this.board.length) {
            return { success: false, reason: "无效的随从索引" };
        }
        
        const attacker = this.board[minionIndex];
        if (attacker.hasAttacked) {
            return { success: false, reason: "该随从本回合已经攻击过" };
        }
        
        if (attacker.windfury && attacker.windfuryAttacksLeft <= 0) {
            return { success: false, reason: "风怒随从本回合已攻击两次" };
        }
        
        // 突袭：出场回合只能攻击随从，不能攻击英雄
        if (attacker.rush && attacker.summonTurn === (window._game ? window._game.turnCount : 1)) {
            if (!(target instanceof Minion)) {
                return { success: false, reason: "突袭随从出场回合只能攻击随从" };
            }
        }
        
        if (attacker.health <= 0) {
            return { success: false, reason: "该随从已死亡" };
        }
        
        let attackerDied = false;
        let targetDied = false;
        
        if (target instanceof Minion) {
            if (target.health <= 0) {
                return { success: false, reason: "目标随从已死亡" };
            }
            
            // 计算实际造成的伤害（考虑圣盾）
            let actualDamage = attacker.attack;
            
            // 圣盾判定
            let targetHadDivineShield = target.divineShield;
            targetDied = target.takeDamage(attacker.attack);
            if (targetHadDivineShield && attacker.attack > 0) {
                actualDamage = 0; // 圣盾完全抵挡伤害
                window._game && window._game.logMessage(`${target.name}的圣盾抵挡了伤害，圣盾被移除`);
            }
            
            // 吸血判定：如果攻击者有吸血且造成了伤害，攻击者的控制者回血
            if (attacker.lifesteal && actualDamage > 0) {
                this.heal(actualDamage);
                window._game && window._game.logMessage(`${attacker.name}的吸血效果为${this.name}恢复了${actualDamage}点生命值`);
            }
            
            // 剧毒判定：如果攻击者有剧毒且造成了伤害，目标随从立即死亡
            if (attacker.poisonous && attacker.attack > 0 && !targetHadDivineShield) {
                target.health = 0;
                targetDied = true;
                window._game && window._game.logMessage(`${attacker.name}的剧毒效果消灭了${target.name}`);
            }
            
            let attackerHadDivineShield = attacker.divineShield;
            attackerDied = attacker.takeDamage(target.attack);
            if (attackerHadDivineShield && target.attack > 0) {
                window._game && window._game.logMessage(`${attacker.name}的圣盾抵挡了伤害，圣盾被移除`);
            }
            
            // 防守方吸血判定：如果防守方有吸血且造成了反伤，防守方的控制者回血
            let counterDamage = target.attack;
            if (target.lifesteal && counterDamage > 0 && !attackerHadDivineShield) {
                this.enemy.heal(counterDamage);
                window._game && window._game.logMessage(`${target.name}的吸血效果从反伤中为${this.enemy.name}恢复了${counterDamage}点生命值`);
            }
            
            // 目标的剧毒判定：如果目标有剧毒且造成了伤害，攻击者立即死亡
            if (target.poisonous && target.attack > 0 && !attackerHadDivineShield) {
                attacker.health = 0;
                attackerDied = true;
                window._game && window._game.logMessage(`${target.name}的剧毒效果消灭了${attacker.name}`);
            }
            
            if (targetDied) {
                const targetIndex = this.enemy.board.findIndex(m => m.id === target.id);
                if (targetIndex !== -1) {
                    const deadMinion = this.enemy.board.splice(targetIndex, 1)[0];
                    this.enemy.graveyard.push(deadMinion);
                }
            }
        } else {
            // 攻击英雄
            let actualDamage = attacker.attack;
            target.takeDamage(attacker.attack);
            
            // 吸血判定：如果攻击者有吸血，攻击者的控制者回血
            if (attacker.lifesteal && actualDamage > 0) {
                this.heal(actualDamage);
                window._game && window._game.logMessage(`${attacker.name}的吸血效果为${this.name}恢复了${actualDamage}点生命值`);
            }
        }
        
        if (attackerDied) {
            const deadMinion = this.board.splice(minionIndex, 1)[0];
            this.graveyard.push(deadMinion);
        } else {
            // 攻击后移除潜行效果
            if (attacker.stealth) {
                attacker.stealth = false;
                if (window._game) {
                    window._game.logMessage(`${attacker.name}失去了潜行效果`);
                }
            }
            
            if (attacker.windfury) {
                attacker.windfuryAttacksLeft--;
                if (attacker.windfuryAttacksLeft <= 0) {
                    attacker.hasAttacked = true;
                }
            } else {
                attacker.hasAttacked = true;
            }
        }
        
        return {
            success: true,
            attackerDied: attackerDied,
            targetDied: target instanceof Minion ? targetDied : false,
            damageDealt: attacker.attack
        };
    }
    
    // 回合结束，重置随从攻击状态
    endTurn() {
        this.board.forEach(minion => {
            minion.hasAttacked = false;
            minion.windfuryAttacksLeft = minion.windfury ? 2 : 1;
        });
        
        // 回合结束英雄攻击状态重置
        this.heroAttacked = false;
        
        // 重置英雄攻击力：只保留来自武器的攻击力
        if (this.weapon) {
            this.heroAttack = this.weapon.attack;
            this.heroCanAttack = true;
        } else {
            this.heroAttack = 0;
            this.heroCanAttack = false;
        }
    }
}
