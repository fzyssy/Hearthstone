// =====================
// 炉石传说翻译框架
// =====================

/**
 * 炉石传说翻译器
 * 统一管理所有英文到中文的翻译映射
 */
window.HSTranslator = {
    // 卡牌类型映射
    typeMap: {
        'MINION': '随从',
        'SPELL': '法术',
        'WEAPON': '武器',
        'HERO': '英雄',
        'HERO_POWER': '英雄技能'
    },

    // 稀有度映射
    rarityMap: {
        'FREE': '无',
        'COMMON': '普通',
        'RARE': '稀有',
        'EPIC': '史诗',
        'LEGENDARY': '传说',
        'BASIC': '基础'
    },

    // 职业映射
    classMap: {
        'NEUTRAL': '中立',
        'DRUID': '德鲁伊',
        'HUNTER': '猎人',
        'MAGE': '法师',
        'PALADIN': '圣骑士',
        'PRIEST': '牧师',
        'ROGUE': '潜行者',
        'SHAMAN': '萨满祭司',
        'WARLOCK': '术士',
        'WARRIOR': '战士',
        'DEMONHUNTER': '恶魔猎手',
        'DEATHKNIGHT': '死亡骑士'
    },

    // 拓展包映射
    setMap: {
        'VANILLA': '怀旧',
        'NAXX': '纳克萨玛斯',
        'GVG': '地精大战侏儒',
        'BRM': '黑石山的火焰',
        'TGT': '冠军的试炼',
        'LOE': '探险者协会',
        'OG': '上古之神',
        'KARA': '卡拉赞',
        'GANGS': '加基森',
        'UNGORO': '安戈洛',
        'ICECROWN': '冰封王座',
        'LOOTAPALOOZA': '狗头人',
        'GILNEAS': '女巫森林',
        'BOOMSDAY': '砰砰计划',
        'TROLL': '拉斯塔哈大乱斗',
        'DALARAN': '暗影崛起',
        'ULDUM': '奥丹姆',
        'DRAGONS': '巨龙降临',
        'YEAR_OF_THE_DRAGON': '迦拉克隆的觉醒',
        'DEMON_HUNTER_INITIATE': '新兵',
        'BLACK_TEMPLE': '外域的灰烬',
        'SCHOLOMANCE': '通灵学园',
        'DARKMOON_FAIRE': '暗月马戏团',
        'THE_BARRENS': '贫瘠之地',
        'STORMWIND': '暴风城',
        'ALTERAC_VALLEY': '奥特兰克',
        'THE_SUNKEN_CITY': '沉没之城',
        'REVENDRETH': '纳斯利亚堡',
        'PATH_OF_ARTHAS': '阿尔萨斯之路',
        'RETURN_OF_THE_LICH_KING': '巫妖王',
        'WONDERS': '时光之穴',
        'BATTLE_OF_THE_BANDS': '音乐节',
        'TITANS': '泰坦诸神',
        'WILD_WEST': '荒芜之地',
        'CORE': '核心',
        'EVENT': '活动',
        'WHIZBANGS_WORKSHOP': '威兹班的工坊',
        'ISLAND_VACATION': '胜地历险记',
        'SPACE': '深暗领域',
        'EMERALD_DREAM': '翡翠梦境',
        'THE_LOST_CITY': '安戈洛龟途',
    },

    // 种族映射
    raceMap: {
        'BEAST': '野兽',
        'DEMON': '恶魔',
        'DRAGON': '龙',
        'MECHANICAL': '机械',
        'MURLOC': '鱼人',
        'PIRATE': '海盗',
        'TOTEM': '图腾',
        'ELEMENTAL': '元素',
        'ALL': '全种族',
        'NAGA': '纳迦',
        'UNDEAD': '亡灵',
        'DRAENEI': '德莱尼',
        'NONE': ''
    },

    /**
     * 翻译单个键值
     * @param {string} type - 映射类型 (type, rarity, class, set, race, mechanics)
     * @param {string} key - 要翻译的键
     * @param {string} defaultValue - 默认值（可选）
     * @returns {string} 翻译后的中文
     */
    translate(type, key, defaultValue = '') {
        const map = this[type + 'Map'];
        if (!map) {
            console.warn(`翻译器未找到映射类型: ${type}`);
            return defaultValue || key;
        }
        return map[key] || defaultValue || key;
    },

    /**
     * 翻译数组（主要用于机制）
     * @param {string} type - 映射类型
     * @param {Array} keys - 要翻译的键数组
     * @param {string} separator - 分隔符，默认为中文逗号
     * @param {Array} excludeKeys - 要排除的键
     * @returns {string} 翻译后的字符串
     */
    translateArray(type, keys, separator = '，', excludeKeys = []) {
        if (!Array.isArray(keys)) return '';

        return keys
            .filter(key => !excludeKeys.includes(key))
            .map(key => this.translate(type, key))
            .join(separator);
    },

    /**
     * 获取所有可用的映射
     * @param {string} type - 映射类型
     * @returns {Object} 映射对象
     */
    getMap(type) {
        return this[type + 'Map'] || {};
    },

    /**
     * 获取所有类型的映射（兼容旧代码）
     */
    getAllMaps() {
        return {
            typeMap: this.typeMap,
            rarityMap: this.rarityMap,
            classMap: this.classMap,
            setMap: this.setMap,
            raceMap: this.raceMap
        };
    }
};

// 为了兼容旧代码，在window上也提供映射
window.setMap = window.HSTranslator.setMap;
window.rarityMap = window.HSTranslator.rarityMap;

console.log('炉石传说翻译框架已加载');
