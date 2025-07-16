<template>
  <div class="metro-page">
    <div ref="container" id="container"></div>

    <div class="popup" id="popup">

    </div>
  </div>
</template>

<script setup>
import Konva from 'konva'
import { onMounted, ref } from 'vue'

const metroPackage = {
  name: '深圳地铁',
  pathSetting: {
    width: 10,
    curve: 0.1,
  },
  stationSetting: {
    radius: 7,
    fill: 'white',
    strokeWidth: 4,
    strokeColor: 'black'
  },
  web: [
    {
      name: 'L1',
      color: 'green',
      parts: [
        { name: '路径', type: 'path', points: [
          291, 1024, 
          489, 1340, 
          728, 1550, 
          787, 1642, 
          786, 1718,
          1018, 1718,
          1099, 1684,
          1718, 1684,
          1748, 1719,
          1969, 1718,
          2016, 1685,
          2175, 1686,
          2284, 1627,
          2344, 1661,
          2344, 1788
        ], },
        { name: '深大', type: 'station', position: [1103, 1685], color: 'red' },
        { name: '机场东', type: 'station', position: [140, 140], color: 'orange' },
        { name: '机场东', type: 'station', position: [305, 267], color: 'yellow' },
        { name: '机场东', type: 'station', position: [555, 300], color: 'green' },
        { name: '机场东', type: 'station', position: [600, 400], color: 'blue' },
      ]
    },
    {
      name: 'L12',
      color: 'purple',
      parts: [
        { name: '路径', type: 'path', points: [
          378, 113, 
          317, 114, 
          261, 383, 
          100, 488, 
          100, 840,
          220, 892,
          287, 892,
          288, 993,
          319, 1040,
          374, 1038,
          960, 1598,
          960, 2090,
          827, 2207
          ], },
        { name: '桃园', type: 'station', position: [960, 1719], color: 'red' },
        { name: '机场东', type: 'station', position: [297, 1023], color: 'orange' },
        { name: '机场东', type: 'station', position: [140, 140], color: 'yellow' },
        { name: '机场东', type: 'station', position: [150, 180], color: 'green' },
        { name: '机场东', type: 'station', position: [100, 400], color: 'blue' },
      ]
    },
    {
      name: '换乘站集合',
      color: 'black',
      parts: [
        { name: '机场东', type: 'station', position: [140, 140], color: 'black' },
      ]
    }
  ]
}


onMounted(() => {
  const container = ref()
  const containerDom = document.getElementById('container')

  console.log('container:', container.value)
  console.log('containerDom:', containerDom)

  const stage = new Konva.Stage({
    container: containerDom,
    width: containerDom.clientWidth,
    height: containerDom.clientHeight,
  })

  for (let line of metroPackage.web) {
    const layer = new Konva.Layer()
    for (let part of line.parts) {
      switch (part.type) {
        case 'path':
          const linePath = new Konva.Line({
            points: part.points,
            stroke: line.color,
            strokeWidth: metroPackage.pathSetting.width,
            lineCap: 'round',
            lineJoin: 'round',
            // tension: metroPackage.pathSetting.curve,
          })
          linePath.on('click', (e) => { console.log(e, line.name) })
          layer.add(linePath)
          break
        case 'station':
          const station = new Konva.Circle({
            x: part.position[0],
            y: part.position[1],
            radius: metroPackage.stationSetting.radius,
            fill: metroPackage.stationSetting.fill,
            stroke: line.color,
            strokeWidth: metroPackage.stationSetting.strokeWidth,
          })
          layer.add(station)
          break
      }
    }
    stage.add(layer)
    layer.batchDraw()
  }

  // 画布拖动逻辑
  let isDragging = false
  let lastPointerPosition = null

  stage.on('mousedown', () => {
    isDragging = true
    lastPointerPosition = stage.getPointerPosition()
  })

  stage.on('mousemove', () => {
    if (isDragging) {
      const pointerPosition = stage.getPointerPosition()
      const dx = pointerPosition.x - lastPointerPosition.x
      const dy = pointerPosition.y - lastPointerPosition.y

      // 移动 stage
      stage.x(stage.x() + dx)
      stage.y(stage.y() + dy)

      // 更新 lastPointerPosition
      lastPointerPosition = pointerPosition

      // 重新渲染
      stage.batchDraw()
    }
  })

  stage.on('mouseup', () => {
    isDragging = false
  })

  // 画布缩放逻辑
  const scaleBy = 1.1 // 每次缩放的倍数
  const minScale = 1
  const maxScale = 5

  stage.on('wheel', (e) => {
    e.evt.preventDefault() // 阻止默认滚动行为

    const oldScale = stage.scaleX()
    const pointerPosition = stage.getPointerPosition()

    // 计算新的缩放比例
    let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
    newScale = Math.max(minScale, Math.min(maxScale, newScale))

    // 设置缩放比例
    stage.scale({ x: newScale, y: newScale })

    // 调整 stage 的位置，使缩放中心为鼠标位置
    const mousePointTo = {
      x: (pointerPosition.x - stage.x()) / oldScale,
      y: (pointerPosition.y - stage.y()) / oldScale,
    }

    const newPos = {
      x: pointerPosition.x - mousePointTo.x * newScale,
      y: pointerPosition.y - mousePointTo.y * newScale,
    }

    stage.position(newPos)

    // 重新渲染
    stage.batchDraw()
  })

  stage.on('dblclick', () => {
    // 重置缩放
    stage.scale({ x: 1, y: 1 })

    // 重置位置
    stage.position({ x: 0, y: 0 })

    // 重新渲染
    stage.batchDraw()
  })

})
</script>

<style lang="scss" scoped>
.metro-page {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
#container {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  border: none;
  overflow: hidden; /* 隐藏溢出内容 */
  background: #ccc;
}
</style>