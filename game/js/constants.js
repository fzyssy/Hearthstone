// 游戏常量
const GAME_CONSTANTS = {
    HERO_POWER_COST: 2,
    MAX_MANA_CRYSTALS: 10,
    STARTING_HEALTH: 30,
    STARTING_HAND_SIZE: 4,
    FIRST_PLAYER_CARDS: 3,
    MAX_GAME_TURNS: 50
};

// Tailwind 配置
tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: '#0A2342',
                secondary: '#D4AF37',
                player: '#2E8B57',
                enemy: '#8B0000',
                card: '#1A3A59',
                board: '#0B5345',
            },
            fontFamily: {
                game: ['Segoe UI', 'Roboto', 'sans-serif'],
            }
        }
    }
};
