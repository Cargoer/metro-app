<template>
  <div class="metro-page">
    <div ref="container" id="svg-container"></div>
    <div class="metro-info fr">
      <img :src="logo.metro[selectedMetro]" alt="METRO-LOGO">
      <div class="title">地铁示意图</div>
    </div>
    <div class="selection-area fr">
      <BlockSelect
        :options="gzMetroData.lines"
        v-model="selectedLines"
        @changeVisible="drawMapBySelection($event, 1)"
        @changeInvisible="drawMapBySelection($event, 0)"
      />
      <BlockSelect
        :options="gzMetroData.coveredDistricts"
        v-model="selectedDistricts"
        @changeVisible="drawMapBySelection($event, 1)"
        @changeInvisible="drawMapBySelection($event, 0)"
      />
    </div>
    <div class="author-info fr">
      <div v-for="(item, index) in authorInfo" :key="'a' + index" class="fr author-item" style="align-items: center;">
        <div class="text fc" style="justify-content: flex-end;">
          <div class="title">{{ item.title }}</div>
          <div class="sub-title">{{ item.subTitle }}</div>
        </div>
        <div class="qr-codes fr">
          <div v-for="(qrCode, qIndex) in item.qrCodes" :key="'q' + qIndex" class="fc" style="gap: 4px; align-items: center;">
            <img :src="qrCode.imgUrl" :alt="qrCode.name">
            <div class="name">{{ qrCode.name }}</div>
          </div>
        </div>
      </div>
    </div>
    
  </div>
</template>

<script setup>
import * as d3 from 'd3'
import gzMetroData from '@/data/gzMetroData.js'
import { computed, onMounted, ref, watch } from 'vue'
import BlockSelect from '@/components/BlockSelect.vue'
import logo from '@/data/logo.js'

// 作者信息
// const images = import.meta.glob('@/assets/*.png', { eager: true });
// const logo = images['@/assets/logo.png'].default;
const rightUrl = computed(() => {
  return (url) => (new URL(url, import.meta.url).href)
})

const authorInfo = [
  {
    title: '纠错&交流',
    subTitle: '关注并私信作者',
    qrCodes: [
      { name: '小红书', imgUrl: import.meta.env.BASE_URL + 'xhs.jpg' },
      { name: 'bilibili', imgUrl: import.meta.env.BASE_URL + 'bilibili.jpg' },
    ]
  },
  {
    title: '鼓励作者',
    subTitle: '如果你喜欢的话',
    qrCodes: [
      { name: '微信赞赏码', imgUrl: import.meta.env.BASE_URL + 'reward.jpg' },
    ]
  },
]

// 地铁信息相关
const selectedMetro = ref('gz')
// 动态导入所有SVG文件（立即加载）
const svgModules = import.meta.glob('@/data/logo/*.svg', { eager: true });
const svgComponent = computed(() => {
  return svgModules[`@/data/logo/${selectedMetro.value}MetroLogo.svg`]?.default || null;
})

// 控制筛选相关
const selectedLines = ref(gzMetroData.lines.map(v => v))
const selectedDistricts = ref(gzMetroData.coveredDistricts.map(v => v))

function drawMapBySelection (selector, opacity) {
  d3.selectAll(selector).transition().duration(200).attr('opacity', opacity)
}

// 请求数据相关
import { Base } from 'seatable-api'

const config = {
  server: 'https://cloud.seatable.cn',
  APIToken: 'NOT USE'
};

const base = new Base(config)

async function getMetroData() {
  await base.auth()
  const stations = await base.listRows('gzMetroStations')
  gzMetroData.stations = stations
}

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
  if (station.lines.length > 1) return '#0F0F0F'
  return gzMetroData.lines.find(line => line.id === station.lines[0]).color;
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
      .attr("class", d => `line ${d.id}`);

    lines.append("path")
      .attr("d", d => generateLinePath(d.points, ratio, d.isCircle))
      .attr("stroke", d => d.color)
      .attr("stroke-width", 5)
      .attr("fill", "none")
      .attr("offset", 30)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .attr("id", d => `${d.id}`);

    // 渲染站点
    const stations = g.selectAll(".station")
      .data(metroData.stations)
      .enter()
      .append("g")
      .attr("class", d => `station ${d.lines.join(' ')} ${d.district}`)
      .attr("id", d => `${d.id}`)
      .attr("transform", d => `translate(${d.x * ratio}, ${d.y * ratio})`);
    
    stations.append("circle")
      .attr("r", 6)
      .attr("fill", "white")
      .attr("stroke", d => getStationStrokeColor(d))
      .attr("stroke-width", 2);
    
    // 添加站点标签
    stations.append("text")
      .attr("x", "8px")
      .attr("y", "8px")
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

// 函数，路径动态演示
function playLineAnimation(lineId) {
  const line = d3.select(`#${lineId}`);
  // const path = line.select("path");
  const length = line.node().getTotalLength();
  line.attr("stroke-dasharray", length)
    .attr("stroke-dashoffset", length)
    .transition()
    .duration(2000)
    .attr("stroke-dashoffset", 0);
}

onMounted(async () => {
  // await getMetroData()
  drawMetroMap(gzMetroData);
  // gzMetroData.lines.map(v => v.id).forEach(lineId => {
  //   playLineAnimation(lineId);
  // })
})
</script>

<style lang="scss" scoped>
* {
  box-sizing: border-box;
}
.fr {
  display: flex;
  gap: 10px;
}
.fc {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.selection-area {
  position: absolute;
  top: 70px;
  left: 10px;
  margin-top: 10px;
}

.metro-info {
  position: absolute;
  height: 60px;
  top: 10px;
  left: 10px;
  background: rgba(243, 246, 247, 0.7);
  padding: 10px;
  border-radius: 6px;
  align-items: center;
  box-shadow: 0 0 10px rgba(75, 142, 188, 0.4);

  .title {
    font-size: 24px;
    color: rgb(37, 36, 36);
    font-weight: 500;
  }
}

.author-info {
  position: absolute;
  // height: 100px;
  bottom: 10px;
  right: 10px;
  background: rgba(243, 246, 247, 0.7);
  padding: 10px;
  border-radius: 6px;
  align-items: center;
  box-shadow: 0 0 10px rgba(75, 142, 188, 0.4);
  align-items: center;
  gap: 10px;

  .text {
    .title {
      font-size: 18px;
      font-weight: 500;
    }
    .sub-title {
      font-size: 14px;
      font-weight: 400;
      color: #aaa;
    }
  }

  .qr-codes {
    gap: 10px;
    --qr-code-size: 80px;
    img {
      width: var(--qr-code-size);
      height: var(--qr-code-size);
      border-radius: 6px;
    }
    .name {
      font-size: 12px;
      font-weight: 400;
      color: #aaa;
    }
  }
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

@media screen and (max-width: 500px) {
  .selection-area {
    flex-direction: column !important;
  }
  .author-item {
    flex-direction: column;
    .text {
      .title {
        font-size: 14px;
      }
    }
    
    .sub-title {
      display: none;
    }
    .qr-codes {
      img {
        width: 60px;
        height: 60px;
      }
    }
  }
  
}
</style>