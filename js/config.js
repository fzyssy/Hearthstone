// 游戏配置
const CONFIG = {
    HERO_CLASSES: [
        { key: 'mage', name: '法师', skill: '造成1点伤害', icon: 'fa-magic', enabled: true },
        { key: 'hunter', name: '猎人', skill: '对敌方英雄造成2点伤害', icon: 'fa-crosshairs', enabled: true },
        { key: 'priest', name: '牧师', skill: '恢复2点生命值', icon: 'fa-plus-square', enabled: true },
        { key: 'warrior', name: '战士', skill: '获得2点护甲值', icon: 'fa-shield', enabled: true },
        { key: 'paladin', name: '圣骑士', skill: '召唤一个1/1的白银之手新兵', icon: 'fa-diamond', enabled: true },
        { key: 'rogue', name: '潜行者', skill: '装备一把1/2的匕首', icon: 'fa-user-secret', enabled: true },
        { key: 'warlock', name: '术士', skill: '抽一张牌并受到2点伤害', icon: 'fa-fire', enabled: true },
        { key: 'druid', name: '德鲁伊', skill: '获得1点攻击力。获得1点护甲值。', icon: 'fa-leaf', enabled: true },
        { key: 'shaman', name: '萨满祭司', skill: '召唤一个随机图腾', icon: 'fa-bolt', enabled: true },
        { key: 'deathknight', name: '死亡骑士', skill: '召唤一个1/1并具有冲锋的食尸鬼。它会在回合结束时死亡', icon: 'fa-skull', enabled: true, avatar: 'deathknight' }
    ],

    MINION_CONFIGS: [
        { name: "翡翠天爪枭", cost: 1, attack: 2, health: 1, rush: true },
        { name: "角鹰兽", cost: 4, attack: 2, health: 6, rush: true, taunt: true },
        { name: "钢铁暴怒者", cost: 4, attack: 5, health: 1, rush: true },
        { name: "阿曼尼战熊", cost: 7, attack: 5, health: 7, rush: true, taunt: true },
        { name: "推土壮汉", cost: 9, attack: 9, health: 9, rush: true },
        { name: "邪巢诱捕蛛", cost: 5, attack: 1, health: 3, rush: true, poisonous: true },
        { name: "蜡油元素", cost: 1, attack: 0, health: 2, taunt: true, divineShield: true },
        { name: "隐秘药剂师", cost: 2, attack: 1, health: 2, stealth: true, divineShield: true },
        { name: "沉默的骑士", cost: 3, attack: 2, health: 2, stealth: true, divineShield: true },
        { name: "石皮蜥蜴", cost: 3, attack: 1, health: 1, poisonous: true, divineShield: true },
        { name: "血色十字军战士", cost: 3, attack: 3, health: 1, divineShield: true },
        { name: "神圣暴怒者", cost: 4, attack: 5, health: 1, divineShield: true },
        { name: "银月城卫兵", cost: 4, attack: 3, health: 3, divineShield: true },
        { name: "达拉然圣剑士", cost: 5, attack: 5, health: 4, divineShield: true },
        { name: "闹闹机器人", cost: 5, attack: 3, health: 4, taunt: true, divineShield: true },
        { name: "烈日行者", cost: 6, attack: 4, health: 5, taunt: true, divineShield: true },
        { name: "强袭坦克", cost: 8, attack: 7, health: 7, divineShield: true },
        { name: "莫什奥格执行者", cost: 8, attack: 2, health: 14, taunt: true, divineShield: true },
        { name: "机械推土牛", cost: 9, attack: 9, health: 7, divineShield: true },
        { name: "死鳞骑士", cost: 1, attack: 1, health: 1, lifesteal: true },
        { name: "沼泽水蛭", cost: 1, attack: 2, health: 1, lifesteal: true },
        { name: "凶恶的鳞片兽", cost: 2, attack: 1, health: 3, lifesteal: true, rush: true },
        { name: "邪犬", cost: 2, attack: 2, health: 2, lifesteal: true },
        { name: "邪魂审判官", cost: 4, attack: 1, health: 6, lifesteal: true, taunt: true },
        { name: "生锈的回收机器人", cost: 5, attack: 2, health: 6, lifesteal: true, taunt: true },
        { name: "血虫", cost: 5, attack: 4, health: 4, lifesteal: true },
        { name: "纵火眼魔", cost: 9, attack: 7, health: 9, lifesteal: true, rush: true },
        { name: "蓝鳃战士", cost: 2, attack: 2, health: 1, charge: true },
        { name: "诺莫瑞根步兵", cost: 3, attack: 1, health: 4, charge: true, taunt: true },
        { name: "暴风城骑士", cost: 4, attack: 2, health: 5, charge: true },
        { name: "鲁莽火箭兵", cost: 6, attack: 5, health: 2, charge: true },
        { name: "银色指挥官", cost: 6, attack: 4, health: 2, charge: true, divineShield: true },
        { name: "银色骑手", cost: 3, attack: 2, health: 1, charge: true, divineShield: true },
        { name: "库卡隆精英卫士", cost: 4, attack: 4, health: 3, charge: true },
        { name: "风领主奥拉基尔", cost: 8, attack: 3, health: 6, charge: true, divineShield: true, taunt: true, windfury: true },
        { name: "寒刃勇士", cost: 4, attack: 3, health: 2, charge: true, lifesteal: true },
        { name: "石牙野猪", cost: 1, attack: 1, health: 1, charge: true },
        { name: "螃蟹骑士", cost: 2, attack: 1, health: 4, rush: true, windfury: true },
        { name: "麻风侏儒", cost: 1, attack: 2, health: 1 },
        { name: "血沼迅猛龙", cost: 2, attack: 3, health: 2 },
        { name: "淡水鳄", cost: 2, attack: 2, health: 3 },
        { name: "铁鬃灰熊", cost: 3, attack: 3, health: 3, taunt: true },
        { name: "闪金镇步兵", cost: 1, attack: 1, health: 2, taunt: true },
        { name: "狼骑兵", cost: 3, attack: 3, health: 1, charge: true },
        { name: "红鳃锋颚战士", cost: 2, attack: 3, health: 1, rush: true },
        { name: "奥术傀儡", cost: 3, attack: 4, health: 2, charge: true },
        { name: "森金持盾卫士", cost: 4, attack: 3, health: 5, taunt: true },
        { name: "冰风雪人", cost: 4, attack: 4, health: 5 },
        { name: "石拳食人魔", cost: 6, attack: 6, health: 7 },
        { name: "暴龙王", cost: 9, attack: 8, health: 8, charge: true },
        { name: "银色侍从", cost: 1, attack: 1, health: 1, divineShield: true },
        { name: "吵吵机器人", cost: 2, attack: 1, health: 2, taunt: true, divineShield: true },
        { name: "小精灵", cost: 0, attack: 1, health: 1 },
        { name: "贪睡巨龙", cost: 9, attack: 6, health: 12, taunt: true },
        { name: "旋翼机", cost: 6, attack: 4, health: 5, rush: true, windfury: true },
        { name: "荆棘谷猛虎", cost: 5, attack: 5, health: 5, stealth: true },
        { name: "废土巨蝎", cost: 7, attack: 3, health: 9, poisonous: true },
        { name: "踏实的大三学姐", cost: 6, attack: 4, health: 9, lifesteal: true },
        { name: "格罗玛什·地狱咆哮", cost: 8, attack: 4, health: 9, charge: true, enrage: true },
        { name: "雷霆蜥蜴", cost: 2, attack: 3, health: 2, windfury: true },
        { name: "风怒鹰身人", cost: 4, attack: 3, health: 3, windfury: true },
        { name: "双头食人魔", cost: 6, attack: 5, health: 5, windfury: true },
        { name: "守护战士", cost: 3, attack: 2, health: 4, taunt: true },
        { name: "岩石巨人", cost: 7, attack: 6, health: 8, taunt: true },
        { name: "钢铁守卫", cost: 5, attack: 3, health: 7, taunt: true },
        { name: "冲锋队长", cost: 3, attack: 3, health: 2, charge: true },
        { name: "迅捷突袭兵", cost: 2, attack: 2, health: 2, rush: true },
        { name: "战斗突袭者", cost: 4, attack: 4, health: 3, rush: true },
        { name: "疾风行者", cost: 5, attack: 4, health: 4, rush: true },
        { name: "吸血蝙蝠", cost: 2, attack: 2, health: 1, lifesteal: true },
        { name: "暗影吸血鬼", cost: 5, attack: 4, health: 5, lifesteal: true },
        { name: "血族首领", cost: 6, attack: 5, health: 6, lifesteal: true },
        { name: "幼龙鹰", cost: 1, attack: 1, health: 1, windfury: true },
        { name: "萨尔玛先知", cost: 3, attack: 2, health: 3, windfury: true },
        { name: "飞行器", cost: 3, attack: 1, health: 4, windfury: true },
        { name: "炫目火鸟", cost: 4, attack: 3, health: 5, windfury: true },
        { name: "功夫大师", cost: 5, attack: 3, health: 5, windfury: true },
        { name: "风怒鹰身人", cost: 6, attack: 4, health: 5, windfury: true },
        { name: "畸变的龙鹰", cost: 7, attack: 5, health: 5, windfury: true },
        { name: "风暴看守", cost: 7, attack: 4, health: 8, windfury: true },
        { name: "铜管元素", cost: 4, attack: 3, health: 3, rush: true, divineShield: true, taunt: true, windfury: true },
        { name: "自动漩涡打击装置", cost: 2, attack: 3, health: 2, windfury: true },
    ],

    WEAPON_CONFIGS: [
        { name: "炽炎战斧", cost: 2, attack: 3, durability: 2 }
    ],

    SPELL_CONFIGS: [
        { name: "玉莲印记", cost: 1, targetType: "all_minions", description: "使你所有的随从获得+1/+1", buffAttack: 1, buffHealth: 1 },
        { name: "火球术", cost: 4, damage: 6, targetType: "any", description: "对任意目标造成6点伤害" }
    ],

    SILVER_HAND_RECRUIT_CONFIG: { name: "白银之手新兵", cost: 0, attack: 1, health: 1 },

    GHOUL_CONFIG: { name: "食尸鬼", cost: 0, attack: 1, health: 1, charge: true },

    DAGGER_CONFIG: { name: "匕首", cost: 0, attack: 1, durability: 2 },

    TOTEM_CONFIGS: [
        { name: "石爪图腾", cost: 1, attack: 0, health: 2, taunt: true },
        { name: "空气图腾", cost: 1, attack: 1, health: 1 }
    ]
};

// 获取配置的便捷方法
const HERO_CLASSES = CONFIG.HERO_CLASSES;
const MINION_CONFIGS = CONFIG.MINION_CONFIGS;
const WEAPON_CONFIGS = CONFIG.WEAPON_CONFIGS;
const SPELL_CONFIGS = CONFIG.SPELL_CONFIGS;
const SILVER_HAND_RECRUIT_CONFIG = CONFIG.SILVER_HAND_RECRUIT_CONFIG;
const GHOUL_CONFIG = CONFIG.GHOUL_CONFIG;
const DAGGER_CONFIG = CONFIG.DAGGER_CONFIG;
const TOTEM_CONFIGS = CONFIG.TOTEM_CONFIGS;
