// 英雄技能处理器
const HERO_SKILL_HANDLERS = {
    mage: function(game, actor, isPlayer) {
        game.logMessage('请选择法师技能的目标（随从或英雄）');
        game.enableMageSkillTarget(isPlayer);
    },
    
    hunter: function(game, actor, isPlayer) {
        actor.manaCrystals -= GAME_CONSTANTS.HERO_POWER_COST;
        actor.enemy.takeDamage(2);
        if (isPlayer) game.heroPowerUsed.player = true;
        else game.heroPowerUsed.enemy = true;
        game.logMessage(`${actor.name}使用了猎人技能，对${isPlayer ? '对手' : '你'}造成2点伤害`);
        game.updateGameUI();
        game.checkGameOver();
    },
    
    priest: function(game, actor, isPlayer) {
        game.logMessage('请选择牧师技能的目标（随从或英雄）');
        game.enablePriestSkillTarget(isPlayer);
    },
    
    paladin: function(game, actor, isPlayer) {
        actor.manaCrystals -= GAME_CONSTANTS.HERO_POWER_COST;
        const recruit = GameUtils.createMinion(SILVER_HAND_RECRUIT_CONFIG, game.minionIdCounter++);
        actor.board.push(recruit);
        if (isPlayer) game.heroPowerUsed.player = true;
        else game.heroPowerUsed.enemy = true;
        game.logMessage(`${actor.name}使用了圣骑士技能，召唤了一个白银之手新兵`);
        game.updateGameUI();
    },
    
    druid: function(game, actor, isPlayer) {
        actor.manaCrystals -= GAME_CONSTANTS.HERO_POWER_COST;
        actor.gainArmor(1);
        // 德鲁伊技能给予临时攻击力，与武器攻击力叠加
        if (actor.weapon) {
            actor.heroAttack = actor.weapon.attack + 1;
        } else {
            actor.heroAttack = 1;
        }
        actor.heroCanAttack = true;
        actor.heroAttacked = false;
        if (isPlayer) game.heroPowerUsed.player = true;
        else game.heroPowerUsed.enemy = true;
        game.logMessage(`${actor.name}使用了德鲁伊技能，获得1点攻击力和1点护甲`);
        game.updateGameUI();
    },
    
    deathknight: function(game, actor, isPlayer) {
        actor.manaCrystals -= GAME_CONSTANTS.HERO_POWER_COST;
        const ghoul = GameUtils.createMinion(GHOUL_CONFIG, game.minionIdCounter++);
        ghoul.ghoulSummonedThisTurn = true;
        actor.board.push(ghoul);
        if (isPlayer) game.heroPowerUsed.player = true;
        else game.heroPowerUsed.enemy = true;
        game.logMessage(`${actor.name}使用了死亡骑士技能，召唤了一个冲锋食尸鬼`);
        game.updateGameUI();
    },
    
    warrior: function(game, actor, isPlayer) {
        actor.manaCrystals -= GAME_CONSTANTS.HERO_POWER_COST;
        actor.gainArmor(2);
        if (isPlayer) game.heroPowerUsed.player = true;
        else game.heroPowerUsed.enemy = true;
        game.logMessage(`${actor.name}使用了战士技能，获得了2点护甲`);
        game.updateGameUI();
    },
    
    warlock: function(game, actor, isPlayer) {
        actor.manaCrystals -= GAME_CONSTANTS.HERO_POWER_COST;
        actor.takeDamage(2);
        actor.drawCard();
        if (isPlayer) game.heroPowerUsed.player = true;
        else game.heroPowerUsed.enemy = true;
        game.logMessage(`${actor.name}使用了术士技能，受到2点伤害并抽一张牌`);
        game.updateGameUI();
        game.checkGameOver();
    },
    
    rogue: function(game, actor, isPlayer) {
        actor.manaCrystals -= GAME_CONSTANTS.HERO_POWER_COST;
        const dagger = GameUtils.createWeapon(DAGGER_CONFIG, game.minionIdCounter++);
        actor.equipWeapon(dagger);
        if (isPlayer) game.heroPowerUsed.player = true;
        else game.heroPowerUsed.enemy = true;
        game.logMessage(`${actor.name}使用了潜行者技能，装备了一把匕首`);
        game.updateGameUI();
    },
    
    shaman: function(game, actor, isPlayer) {
        actor.manaCrystals -= GAME_CONSTANTS.HERO_POWER_COST;
        const totemCfg = TOTEM_CONFIGS[Math.floor(Math.random() * TOTEM_CONFIGS.length)];
        const totem = GameUtils.createMinion(totemCfg, game.minionIdCounter++);
        actor.board.push(totem);
        if (isPlayer) game.heroPowerUsed.player = true;
        else game.heroPowerUsed.enemy = true;
        game.logMessage(`${actor.name}使用了萨满祭司技能，召唤了一个${totem.name}`);
        game.updateGameUI();
    }
};
