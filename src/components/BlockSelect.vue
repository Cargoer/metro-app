<template>
  <div class="selections fc">
    <div
      class="selection" 
      @click="toggleLinesSelectAll" 
    >
      {{ selectedItems.length === props.options.length ? 'None' : 'All' }}
    </div>
    <div
      v-for="(option, index) in options" 
      :key="index" 
      class="selection" 
      :style="selectionStyle(option)"
      @click="toggleItemSelection(option)"
    >
      {{ option.id ? option.id.slice(1) : option }}
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue"
const selectedItems = defineModel()

const props = defineProps({
  options: {
    type: Array,
    default: () => []
  },
})

const emit = defineEmits(['changeVisible', 'changeInvisible'])

const selectionStyle = computed(() => {
  return (option) => {
    const textColor = ['L1', 'L11', 'L9'].includes(option.id) ? '#000' : '#fff'
    return {
      background: selectedItems.value.includes(option) ? option.color || '#2376b7' : '#fff',
      color: selectedItems.value.includes(option) ? textColor : option.color || '#2376b7',
      borderColor: option.color || '#2376b7'
    }
  }
})

function toggleLinesSelectAll () {
  if (selectedItems.value.length === props.options.length) {
    selectedItems.value = []
    emit('changeInvisible', selectedItems.value.map(v => `.${v.id ? v.id : v}`).join(', '))
  } else {
    const newSelectItems = props.options.filter(v => !selectedItems.value.includes(v))
    selectedItems.value = props.options.map(v => v)
    emit('changeVisible', newSelectItems.map(v => `.${v.id ? v.id : v}`).join(', '))
  }
}

function toggleItemSelection (option) {
  if (selectedItems.value.includes(option)) {
    const pos = selectedItems.value.indexOf(option)
    selectedItems.value.splice(pos, 1)
    emit('changeInvisible', `.${option.id ? option.id : option}`)
    // console.log('[toggleItemSelection] selectedItems.value', selectedItems.value)

    // selectedItems.value = selectedItems.value.filter(v => v.id ? v.id !== option.id : v !== option)
    // console.log('[toggleItemSelection] selectedItems.value', selectedItems.value)
  } else {
    selectedItems.value.push(option)
    emit('changeVisible', `.${option.id ? option.id : option}`)
  }
}
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
.selections {
  display: flex;
  background: rgba(255, 255, 255, 0.7);
  padding: 10px;
  max-height: calc(100vh - 90px);
  flex-wrap: wrap;
  overflow-y: auto;
  // TODO 隐藏滚动条
  .selection {
    width: 50px;
    height: 40px;
    text-align: center;
    line-height: 40px;
    border-radius: 5px;
    border: 2px solid #F6F6F6;
    cursor: pointer;
    overflow: hidden;
  }
}

@media screen and (max-width: 500px) {
  .selections {
    display: flex;
    flex-direction: row !important;
    // background: #000 !important;
    gap: none;
    flex-wrap: nowrap;
    overflow-x: auto;
    max-width: calc(100vw - 20px);
    .selection {
      width: 8vw;
      height: 8vw;
      line-height: 8vw;
      font-size: 3vw;
      flex-shrink: 0;
    }
  }
}

</style>