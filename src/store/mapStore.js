import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { io } from 'socket.io-client'
import SubwayMap from '../models/SubwayMap';
import router from '../router/index'
import GameControl from '../models/gameControl'

class MapGrid {
  constructor (width, height, cellSize) {
    this.cellSize = cellSize;
    this.rows = Math.ceil(height / cellSize);
    this.cols = Math.ceil(width / cellSize);
    this.cells = Array(this.rows).fill().map(() => Array(this.cols).fill(false));
  }

  getCell (x, y) {
    const row = Math.floor(y / this.cellSize);
    const col = Math.floor(x / this.cellSize);
    return { row, col, cellContent: this.cells[row][col] };
  }

  getDistance (target, row, col) {
    const { x, y } = target
    const cellX = Math.floor(col / this.cellSize);
    const cellY = Math.floor(row / this.cellSize);
    return Math.sqrt((cellX - x) ** 2 + (cellY - y) ** 2);
  }

  isCollapse (startRow, startCol, size) {
    const { row: endRow, col: endCol } = this.getCell(startRow * this.cellSize + size.width, startCol * this.cellSize + size.height);
    for (let i = startRow; i < endRow; i++) {
      for (let j = startCol; j < endCol; j++) {
        if (this.cells[i][j].length !== 0) return true;
      }
    }
    return false;
  }

  getCloseVacantCell (x, y, referrence, maxDistance, size) {
    let { row, col, cellContent } = this.getCell(x, y);
    if (cellContent.length === 0) return { x, y }; // 所在位置没有其他元素

    while (this.isCollapse(row, col, size) && this.getDistance(referrence, row, col) < maxDistance) row++
    if (!this.isCollapse(row, col, size)) return { x: col * this.cellSize, y: row * this.cellSize };

    while (this.isCollapse(row, col, size) && this.getDistance(referrence, row, col) < maxDistance) row++
    if (!this.isCollapse(row, col, size)) return { x: col * this.cellSize, y: row * this.cellSize };

    while (this.isCollapse(row, col, size) && this.getDistance(referrence, row, col) < maxDistance) row++
    if (!this.isCollapse(row, col, size)) return { x: col * this.cellSize, y: row * this.cellSize };

    while (this.isCollapse(row, col, size) && this.getDistance(referrence, row, col) < maxDistance) row++
    if (!this.isCollapse(row, col, size)) return { x: col * this.cellSize, y: row * this.cellSize };

    return { x, y };
  }
}

export const useMapStore = defineStore('map', () => {
  // 全局游戏数据相关
  const curGameId = ref(null)
  const subwayMap = reactive(new SubwayMap())
  const gameController = reactive(new GameControl())
  const stationMode = ref('normal') // normal, select-选择非本玩家所占的站点

  const curPlayer = computed(() => gameController.players[gameController.currentPlayerIndex])

  // 当前玩家信息
  const playerId = ref(null)
  const playerName = ref('')

  // 通信相关
  let socket = null
  const serverUrl = 'http://localhost:5000'
  const connectState = ref('disconnect') // connecting connected disconnect

  function connect () {
    if (socket) return
    try {
      console.log('[connecting]')
      connectState.value = 'connecting'
      socket = io(serverUrl, {
        transports: ['websocket'],
        autoConnect: true
      })

      // 监听基本连接情况
      socket.on('connect', () => { connectState.value = 'connected'; console.log('[connected!]') })
      socket.on('disconnect', (reason) => {
        connectState.value = 'disconnect'
        console.error('Socket disconnected:', reason)
        // 如果是服务器关闭导致的断开，尝试重新连接
        if (reason === 'io server disconnect') {
          socket.connect();
        }
      })
      socket.on('connect_error', (err) => {
        connectState.value = 'disconnect'
        console.error('Socket connection error:', err);
        // 连接错误处理，例如尝试重新连接
        socket.connect();
      })

      // 监听房间玩家准备情况
      socket.on('gameStateUpdate', (gameData) => {
        updateGameState(gameData)
      })

      // 监听游戏开始
      socket.on('gameStarted', (gameData) => {
        updateGameState(gameData)
        router.push({ name: 'game', params: { gameId: curGameId.value } });
      })
    } catch (err) {
      connectState.value = 'disconnect'
      console.error('Socket initialization error:', err)
    }
  }

  function emit (event, data, callback) {
    if (!socket || connectState.value !== 'connected') {
      console.warn('Socket not connected, cannot emit event:', event);
      if (callback) callback({ success: false, error: 'Not connected' });
      return;
    }

    console.log('Emitting event:', event, data, socket.id);
    socket.emit(event, data, callback);
  }

  function on(event, callback) {
    if (!socket || connectState.value !== 'connected') {
      console.warn('Socket not initialized, cannot listen to event:', event);
      return;
    }
    
    socket.on(event, (data) => {
      console.log('Received event:', event, data);
      callback(data);
    });
  }

  function initMap (mapData) {
    // 添加站点
    mapData.stations.forEach(station => {
      subwayMap.addStation(station.id, station);
    });
    console.log('subwayMap', subwayMap);
    
    // 添加线路
    mapData.lines.forEach(line => {
      subwayMap.addLine(line.id, line);
      line.stationIds.forEach((stationId, index) => {
        if (index > 0) {
          subwayMap.connectStations(stationId, line.stationIds[index - 1], line.id, 1)
        }
      })
    });
    
    // 添加连接
    if (mapData.connections) {
      mapData.connections.forEach(connection => {
        subwayMap.connectStations(
          connection.stationIds[0],
          connection.stationIds[1],
          connection.lineId,
          connection.distance
        );
      });
    }
  }

  function setPlayerInfo (id, name, gid) {
    id && (playerId.value = id)
    name && (playerName.value = name)
    gid && (curGameId.value = gid)
  }

  // 更新游戏状态
  function updateGameState (gc) {
    gameController.copy(gc) // 更新玩家相关视图
    initMap(gc.map) // 更新地图视图
  }

  function setStationMode (mode) {
    stationMode.value = mode
  }

  return {
    emit, on,
    connect,
    playerId, playerName, setPlayerInfo,
    updateGameState,
    subwayMap, initMap,
    stationMode, setStationMode,
    curGameId,
    gameController, curPlayer,
  }
})