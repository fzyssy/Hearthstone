// 随从类，继承自 Card
class Minion extends Card {
    constructor(name, cost, attack, health, taunt = false, charge = false, id, divineShield = false, rush = false, windfury = false, stealth = false, poisonous = false, lifesteal = false, enrage = false) {
        super(name, cost);
        this.baseAttack = attack; // 基础攻击力
        this.attack = attack; // 当前攻击力
        this.health = health; // 当前生命值
        this.maxHealth = health; // 最大生命值
        this.taunt = taunt; // 是否有嘲讽
        this.charge = charge; // 是否有冲锋
        this.rush = rush; // 是否有突袭
        this.hasAttacked = !(charge || rush); // 冲锋/突袭随从可立即攻击
        this.windfury = windfury; // 是否有风怒
        this.windfuryAttacksLeft = windfury ? 2 : 1; // 本回合剩余攻击次数
        this.id = id; // 唯一标识
        this.divineShield = divineShield; // 是否有圣盾
        this.stealth = stealth; // 是否有潜行
        this.poisonous = poisonous; // 是否有剧毒
        this.lifesteal = lifesteal; // 是否有吸血
        this.enrage = enrage; // 是否有激怒效果
        this.summonTurn = null; // 记录召唤回合
        
        // 更新攻击力（检查激怒效果）
        this.updateAttack();
    }
    
    // 更新攻击力（处理激怒效果）
    updateAttack() {
        this.attack = this.baseAttack;
        if (this.enrage && this.isDamaged()) {
            if (this.name === "格罗玛什·地狱咆哮") {
                this.attack += 6; // 格罗玛什受伤时+6攻击力
            }
        }
    }
    
    // 检查是否受伤
    isDamaged() {
        return this.health < this.maxHealth;
    }
    
    // 受到伤害，返回是否死亡
    takeDamage(amount) {
        if (this.divineShield && amount > 0) {
            this.divineShield = false;
            return false; // 圣盾免疫本次伤害
        }
        this.health -= amount;
        this.updateAttack(); // 受伤后更新攻击力
        return this.health <= 0;
    }
    
    // 治疗
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        this.updateAttack(); // 治疗后更新攻击力
    }
    
    // 转为字符串描述
    toString() {
        let special = [];
        if (this.taunt) special.push("嘲讽");
        if (this.charge) special.push("冲锋");
        if (this.divineShield) special.push("圣盾");
        if (this.stealth) special.push("潜行");
        if (this.poisonous) special.push("剧毒");
        if (this.lifesteal) special.push("吸血");
        if (this.enrage && this.isDamaged()) {
            if (this.name === "格罗玛什·地狱咆哮") {
                special.push("激怒(+6攻击力)");
            }
        }
        let specialText = special.length > 0 ? ` (${special.join(', ')})` : '';
        return `${this.name} (攻: ${this.attack}, 血: ${this.health}/${this.maxHealth})${specialText}`;
    }
}
