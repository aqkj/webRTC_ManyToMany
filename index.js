const WsServer = require('ws').Server


const wss = new WsServer({
  port: '9900'
})
// 房间列表
const rooms = []
// 当前在线玩家
const players = {}
// 监听端口
wss.on('listening', () => {
  console.log('端口监听9900')
})
// 玩家id
let id = 1
// 房间id
let roomId = 1
// 链接
wss.on('connection', (ws) => {
  /** 
   * 发送数据 
   **/
  function sendMessage(type, data, player = ws) {
    player.send(JSON.stringify({
      type,
      data
    }))
  }
  /** 
   * 发送数据给多人
   **/
  function sendMessageForPlayers(type, data, players = []) {
    players.forEach(player => {
      sendMessage(type, data, player)
    })
  }
  /**
   * 离开房间
   */
  function leaveRoom(ws) {
    if (ws.room) {
      const { players } = ws.room
      const index = players.findIndex(player => player === ws)
      if (index !== -1) {
        players.splice(index, 1)
      }
      ws.room = null
      sendMessageForPlayers('leaveRoom', ws.id, players)
    } else {
      sendMessage('error', '未找到房间')
    }
  }
  /**
   * 初始化
   */
  function init() {
    // 初始化
    sendMessage('init', {
      id: ws.id,
      rooms: rooms.map(room => ({
        id: room.id,
        players: room.players.map(item => item.id)
      }))
    })
  }
  // 初始化id
  ws.id = id ++
  players[ws.id] = ws
  init()
  console.log('链接成功', ws.id)
  ws.on('message', (message) => {
    console.log('收到信息', message)
    const messageData = JSON.parse(message || '{}')
    const { type = '', data } = messageData
    // 创建房间
    if (type === 'createRoom') {
      if (ws.room) return sendMessage('error', '你已经在房间中')
      const room = {
        id: roomId++,
        players: [ws]
      }
      rooms.push(room)
      ws.room = room
      sendMessage('joinRoom', {
        id: room.id,
        players: room.players.map(item => item.id)
      })
    } else if (type === 'joinRoom') { // 加入房间
      if (ws.room) return sendMessage('error', '你已经在房间中')
      const room = rooms.find(item => ~~item.id === ~~data)
      if (room) {
        const item = room.players.find(item => item.id === ws.id)
        if (item) return sendMessage('error', '你已经在房间中')
        room.players.push(ws)
        ws.room = room
        sendMessage('joinRoom', {
          id: room.id,
          players: room.players.map(item => item.id)
        })
      } else {
        sendMessage('error', '房间不存在')
      }
    } else if (type === 'leaveRoom') { // 离开房间
      leaveRoom(ws)
    } else if (type === 'init') {
      init()
    } else if (type.match(/rtc_/)) { // 发送rtc数据
      // 是否存在
      if (ws.room) {
        const { id } = data
        const { players } = ws.room
        const player = players.find(player => ~~player.id === ~~id)
        sendMessage(type, {
          ...data,
          id: ws.id
        }, player)
      } else {
        sendMessage('error', '你不在房间内')
      }
    }
  })
  ws.on('error', () => {
    console.log('链接错误', ws.id)
  })
  ws.on('close', () => {
    console.log('链接关闭', ws.id)
    leaveRoom(ws)
  })
})