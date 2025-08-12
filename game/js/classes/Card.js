// 卡牌基础类
class Card {
    constructor(name, cost) {
        this.name = name;
        this.cost = cost;
    }
    
    toString() {
        return `${this.name} (cost: ${this.cost})`;
    }
}
