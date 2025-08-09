// 游戏工具函数
const GameUtils = {
    // 创建随从实例
    createMinion: (cfg, idCounter) => {
        return new Minion(
            cfg.name, cfg.cost, cfg.attack, cfg.health,
            cfg.taunt || false, cfg.charge || false, idCounter,
            cfg.divineShield || false, cfg.rush || false, cfg.windfury || false, cfg.stealth || false, cfg.poisonous || false, cfg.lifesteal || false, cfg.enrage || false
        );
    },
    
    // 创建武器实例
    createWeapon: (cfg, idCounter) => {
        return new Weapon(cfg.name, cfg.cost, cfg.attack, cfg.durability, idCounter);
    },
    
    // 创建法术实例
    createSpell: (cfg, idCounter) => {
        return new Spell(
            cfg.name, cfg.cost, cfg.damage, cfg.targetType, 
            cfg.description, idCounter, cfg.buffAttack, cfg.buffHealth
        );
    },
    
    // 洗牌算法
    shuffleArray: (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },
    
    // 获取特效文本
    getEffectsText: (card, isSmall = false) => {
        const effects = [];
        const size = isSmall ? 'text-xs' : 'text-sm';
        if (card.taunt) effects.push(`<span class="text-blue-400 ${size}"><i class="fa fa-shield"></i> 嘲讽</span>`);
        if (card.charge) effects.push(`<span class="text-green-400 ${size}"><i class="fa fa-bolt"></i> 冲锋</span>`);
        if (card.rush) effects.push(`<span class="text-orange-400 ${size}"><i class="fa fa-bolt"></i> 突袭</span>`);
        if (card.windfury) effects.push(`<span class="text-cyan-300 ${size}"><i class="fa fa-refresh"></i> 风怒</span>`);
        if (card.divineShield) effects.push(`<span class="text-yellow-300 ${size}"><i class="fa fa-circle-o"></i> 圣盾</span>`);
        if (card.stealth) effects.push(`<span class="text-purple-400 ${size}"><i class="fa fa-eye-slash"></i> 潜行</span>`);
        if (card.poisonous) effects.push(`<span class="text-green-500 ${size}"><i class="fa fa-tint"></i> 剧毒</span>`);
        if (card.lifesteal) effects.push(`<span class="text-red-400 ${size}"><i class="fa fa-heart"></i> 吸血</span>`);
        if (card.enrage) {
            if (card.name === "格罗玛什·地狱咆哮") {
                const enrageText = card.isDamaged && card.isDamaged() ? "激怒(+6攻)" : "激怒";
                effects.push(`<span class="text-red-500 ${size}"><i class="fa fa-fire"></i> ${enrageText}</span>`);
            }
        }
        return effects.join(' ');
    },
    
    // 获取英雄头像
    getHeroAvatar: (heroClass) => {
        if (heroClass.key === 'deathknight') {
            return `<svg width="60" height="60" viewBox="0 0 60 60" class="mx-auto"><circle cx="30" cy="30" r="28" fill="#222"/><text x="30" y="38" text-anchor="middle" font-size="32" fill="#00eaff" font-family="serif" font-weight="bold">DK</text></svg>`;
        }
        return `<i class="fa ${heroClass.icon} text-4xl"></i>`;
    }
};
