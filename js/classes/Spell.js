// 法术类，继承自 Card
class Spell extends Card {
    constructor(name, cost, damage, targetType, description, id, buffAttack = 0, buffHealth = 0) {
        super(name, cost);
        this.damage = damage || 0; // 伤害值（暂时保留用于扩展）
        this.targetType = targetType; // 目标类型: "all_minions"（当前只支持群体法术）
        this.description = description; // 法术描述
        this.id = id; // 唯一标识
        this.buffAttack = buffAttack || 0; // 增益攻击力
        this.buffHealth = buffHealth || 0; // 增益生命值
    }
    
    // 对目标施放法术（支持群体法术和单体目标法术）
    cast(caster, target, game) {
        if (this.targetType === "all_minions") {
            return this.castOnAllMinions(caster, game);
        } else if (this.targetType === "any") {
            return this.castOnSingleTarget(caster, target, game);
        } else {
            return { success: false, reason: "不支持的法术类型" };
        }
    }
    
    // 对所有随从施放（如玉莲印记、祈福术）
    castOnAllMinions(caster, game) {
        const affectedMinions = caster.board.length;
        
        if (affectedMinions === 0) {
            game.logMessage(`${caster.name}使用了${this.name}，但场上没有随从`);
            return { success: true };
        }
        
        caster.board.forEach(minion => {
            minion.attack += this.buffAttack;
            minion.health += this.buffHealth;
            minion.maxHealth += this.buffHealth;
        });
        
        const buffText = this.buffAttack > 0 && this.buffHealth > 0 ? 
            `+${this.buffAttack}/+${this.buffHealth}` : 
            (this.buffAttack > 0 ? `+${this.buffAttack}攻击力` : `+${this.buffHealth}生命值`);
        
        game.logMessage(`${caster.name}使用了${this.name}，${affectedMinions}个随从获得${buffText}`);
        return { success: true };
    }
    
    // 对单个目标施放法术（如火球术）
    castOnSingleTarget(caster, target, game) {
        if (!target) {
            return { success: false, reason: "必须选择一个目标" };
        }
        
        // 对目标造成伤害
        if (this.damage > 0) {
            if (target.type === 'hero') {
                // 攻击英雄
                const defender = target.player;
                const actualDamage = Math.min(this.damage, defender.health + defender.armor);
                
                if (defender.armor > 0) {
                    const armorLoss = Math.min(this.damage, defender.armor);
                    defender.armor -= armorLoss;
                    const remainingDamage = this.damage - armorLoss;
                    if (remainingDamage > 0) {
                        defender.health -= remainingDamage;
                    }
                } else {
                    defender.health -= this.damage;
                }
                
                defender.health = Math.max(0, defender.health);
                defender.armor = Math.max(0, defender.armor);
                
                game.logMessage(`${caster.name}使用${this.name}对${defender.name}造成${actualDamage}点伤害`);
            } else if (target.type === 'minion') {
                // 攻击随从
                const minion = target.minion;
                const died = minion.takeDamage(this.damage);
                
                game.logMessage(`${caster.name}使用${this.name}对${minion.name}造成${this.damage}点伤害`);
                
                // 检查随从是否死亡
                if (died) {
                    const owner = target.owner;
                    const index = owner.board.indexOf(minion);
                    if (index > -1) {
                        const deadMinion = owner.board.splice(index, 1)[0];
                        owner.graveyard.push(deadMinion);
                        game.logMessage(`${minion.name}死亡了`);
                    }
                }
            }
        }
        
        return { success: true };
    }
    
    toString() {
        return `${this.name} (费用: ${this.cost}) - ${this.description}`;
    }
}
