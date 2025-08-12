const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3001 });


const MAX_PLAYERS = 2; // 最大2人
let room = {
  players: [],
  turn: 0, // 当前轮到谁
  locked: false, // 房间锁定标志
  currentCard: null, // 当前要猜的卡牌
  guesses: [], // 所有猜测记录
  gameStarted: false // 游戏是否开始
};

function broadcast(msg) {
  room.players.forEach(p => p.ws.send(JSON.stringify(msg)));
}

function startNewGame() {
  // 开始新游戏，重置状态
  room.guesses = [];
  room.gameStarted = true;
  room.turn = 0;

  broadcast({
    type: 'gameStart',
    msg: '新游戏开始！',
    players: room.players.map(p => p.id),
    turn: room.players[room.turn].id
  });

  broadcast({ type: 'turn', userId: room.players[room.turn].id });
}

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    let data;
    try { data = JSON.parse(message); } catch { return; }

    if (data.type === 'join') {
      // 不再校验roomCode，直接加入唯一房间
      if (room.locked) {
        ws.send(JSON.stringify({ type: 'error', msg: '房间已锁定，无法加入' }));
        ws.close();
        return;
      }
      if (room.players.length >= MAX_PLAYERS) {
        ws.send(JSON.stringify({ type: 'error', msg: '房间已满' }));
        ws.close();
        return;
      }
      if (room.players.find(p => p.id === data.userId)) {
        ws.send(JSON.stringify({ type: 'error', msg: 'ID已存在' }));
        ws.close();
        return;
      }
      room.players.push({ id: data.userId, ws });
      broadcast({ type: 'system', msg: `${data.userId} 加入了房间`, players: room.players.map(p => p.id) });

      // 人数达到2时锁定房间并开始游戏
      if (room.players.length >= MAX_PLAYERS) {
        room.locked = true;
        broadcast({ type: 'system', msg: '房间已锁定，游戏即将开始', players: room.players.map(p => p.id) });
        // 延迟1秒开始游戏
        setTimeout(() => {
          startNewGame();
        }, 1000);
      }

      // 如果是第一个人，等待第二个人
      if (room.players.length === 1) {
        broadcast({ type: 'system', msg: '等待第二个玩家加入...' });
      }
    }

    if (data.type === 'guess') {
      // 只有轮到的人才能猜
      if (!room.gameStarted) {
        ws.send(JSON.stringify({ type: 'error', msg: '游戏还未开始' }));
        return;
      }
      if (room.players[room.turn].id !== data.userId) {
        ws.send(JSON.stringify({ type: 'error', msg: '还没轮到你' }));
        return;
      }

      // 记录猜测
      const guess = {
        userId: data.userId,
        cardId: data.cardId,
        cardName: data.cardName,
        timestamp: Date.now()
      };
      room.guesses.push(guess);

      // 广播猜测内容给所有人
      broadcast({
        type: 'guess',
        userId: data.userId,
        cardId: data.cardId,
        cardName: data.cardName,
        guesses: room.guesses // 发送所有猜测记录
      });

      // 轮到下一个人
      room.turn = (room.turn + 1) % room.players.length;
      broadcast({ type: 'turn', userId: room.players[room.turn].id });
    }

    if (data.type === 'newGame') {
      // 重新开始游戏
      if (room.players.length >= 2) {
        startNewGame();
      } else {
        ws.send(JSON.stringify({ type: 'error', msg: '需要至少2个玩家才能开始游戏' }));
      }
    }
  });

  ws.on('close', function () {
    // 移除断开的人
    room.players = room.players.filter(p => p.ws !== ws);
    if (room.turn >= room.players.length) room.turn = 0;

    // 如果房间人数少于最大值，解除锁定
    if (room.players.length < MAX_PLAYERS) {
      room.locked = false;
      room.gameStarted = false;
      room.guesses = [];
      broadcast({ type: 'system', msg: '房间已解锁，游戏停止', players: room.players.map(p => p.id) });
    }

    broadcast({ type: 'system', msg: '有玩家离开', players: room.players.map(p => p.id) });

    if (room.players.length > 0 && room.gameStarted) {
      broadcast({ type: 'turn', userId: room.players[room.turn].id });
    }
  });
});

console.log('WebSocket服务器已启动，端口3001');
