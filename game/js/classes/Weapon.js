// 武器类，继承自 Card
class Weapon extends Card {
    constructor(name, cost, attack, durability, id) {
        super(name, cost);
        this.attack = attack; // 攻击力
        this.durability = durability; // 耐久度
        this.maxDurability = durability; // 最大耐久度
        this.id = id; // 唯一标识
    }
    
    // 使用武器攻击，消耗耐久度
    useDurability() {
        this.durability--;
        return this.durability <= 0;
    }
    
    toString() {
        return `${this.name} (攻: ${this.attack}, 耐久: ${this.durability}/${this.maxDurability})`;
    }
}
