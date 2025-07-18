<template>
  <NuxtRouteAnnouncer />  
  <UTextarea v-model="txValue" />
  <hr />
  <button @click="execute">execute</button>
  <hr />
  <pre>{{ gettet }}</pre>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Transpile } from './transcriptor/main'
import { getTextMiniRipACHIII } from './transcriptor/utils'

const txValue = ref('')

const gettet = computed(() => Transpile(txValue.value))

const execute = () => {
  console.log(Transpile(txValue.value, true))
}
  onMounted(() => {
    (window as any).getTextMiniRipACHIII = getTextMiniRipACHIII;
})
</script>

