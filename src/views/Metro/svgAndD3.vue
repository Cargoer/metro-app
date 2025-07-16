<template>
  <div class="metro-page">
    <div ref="container" id="svg-container"></div>
    <div class="selection">

    </div>
  </div>
</template>

<script setup>
import * as d3 from 'd3'
import gzMetroData from '@/data/gzMetroData.js'
import { onMounted, ref } from 'vue'

import { Base } from 'seatable-api'

const config = {
  server: 'https://cloud.seatable.cn',
  APIToken: '3cfcf75b0a69a55d420dac94bf364bf779b67b31'
};

const base = new Base(config)

// 辅助函数：生成线路路径 TODO 使拐点变得圆润
function generateLinePath(points, ratio=1, isCircle=false) {
  const pathCode = points.split(';').reduce((path, point, index) => {
    if (!point) return path
    const [x, y] = point.split(',')
    if (index === 0) {
      return `M${x * ratio},${y * ratio}`;
    } else {
      return `${path} L${x * ratio},${y * ratio}`;
    }
  }, '');
  if (isCircle) {
    return pathCode + 'Z'
  }
  return pathCode
}

function getStationStrokeColor(station) {
  return gzMetroData.lines.find(line => line.id === station.lines[0]).color;
}

function getStationNameOffset(station) {
  if (!station.namePos) return { x: 8, y: 4 }
  let x = - (station.name.length * 8 / 2)
  let y = 4
  if (station.namePos.includes('right')) {
    x += (8 + station.name.length * 8 / 2)
  }
  if (station.namePos.includes('left')) {
    x -= (8 + station.name.length * 8 / 2)
  }
  if (station.namePos.includes('top')) {
    y -= 12
  }
  if (station.namePos.includes('bottom')) {
    y += 12
  }
  return { x, y }
}

function drawMetroMap(metroData) {
  // 创建SVG容器
  // 长宽为窗口的长宽
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  const svg = d3.select("#svg-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`);
  
  const g = svg.append("g");
  
  // 创建缩放和平移功能
  const zoom = d3.zoom()
    .scaleExtent([0.5, 5])
    .on("zoom", function(event) {
      g.attr("transform", event.transform);
    });
  
  svg.call(zoom);

  svg.call(zoom.transform, d3.zoomIdentity);

  const ratio = height / metroData.size[1]

  // 渲染河流
  const rivers = g.selectAll(".river")
    .data(metroData.rivers)
    .enter()
    .append("g")
    .attr("class", "river");

  rivers.append("path")
    .attr("d", d => generateLinePath(d, ratio))
    .attr("stroke", metroData.riverColor)
    .attr("stroke-width", 10)
    .attr("fill", "none")
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round");

  // 渲染线路
    const lines = g.selectAll(".line")
      .data(metroData.lines)
      .enter()
      .append("g")
      .attr("class", "line");

    lines.append("path")
      .attr("d", d => generateLinePath(d.points, ratio, d.isCircle))
      .attr("stroke", d => d.color)
      .attr("stroke-width", 5)
      .attr("fill", "none")
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round");

    // 渲染站点
    const stations = g.selectAll(".station")
      .data(metroData.stations)
      .enter()
      .append("g")
      .attr("class", "station")
      .attr("transform", d => `translate(${d.x * ratio}, ${d.y * ratio})`);
    
    stations.append("circle")
      .attr("r", 6)
      .attr("fill", "white")
      .attr("stroke", d => getStationStrokeColor(d))
      .attr("stroke-width", 2);
    
    // 添加站点标签
    stations.append("text")
      .attr("x", d => getStationNameOffset(d).x)
      .attr("y", d => getStationNameOffset(d).y)
      .attr("fill", "#333")
      .attr("font-size", "8px")
      .text(d => d.name);

    stations.on("mouseover", function(event, d) {
      d3.select(this).select("circle")
        .transition()
        .duration(200)
        .attr("r", 10)
        .attr("stroke-width", 3);
      
      // tooltip.transition()
      //   .duration(200)
      //   .style("opacity", 0.9);
      
      // tooltip.html(`<strong>${d.name}</strong><br>所属线路: ${getLineName(d.lineId)}`)
      //   .style("left", (event.pageX + 10) + "px")
      //   .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function(event, d) {
      d3.select(this).select("circle")
        .transition()
        .duration(200)
        .attr("r", 6)
        .attr("stroke-width", 2);
      
      // tooltip.transition()
      //   .duration(500)
      //   .style("opacity", 0);
    })

  // 计算内容边界
  const bounds = g.node().getBBox();
  const { x, y, width: cw, height: ch } = bounds;

  // 设置viewBox（关键：让SVG自适应内容）
  svg.attr("viewBox", `${x - 10} ${y - 10} ${cw + 20} ${ch + 20}`);
}

onMounted(async () => {
  // await base.auth()
  // await base.batchAppendRows('gzMetroStations', gzMetroData.stations)
  drawMetroMap(gzMetroData);
})
</script>

<style lang="scss" scoped>
* {
  box-sizing: border-box;
}
#svg-container {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  border: none;
  overflow: hidden; /* 隐藏溢出内容 */
  background: #F6F6F6;
}
</style>