<template>
  <NuxtRouteAnnouncer />  
  <UTextarea v-model="txValue" />
  <hr/>
  <button @click="execute">execute</button>
  <hr/>
  <pre>{{ gettet }}</pre>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Transpile } from './transcriptor/main'
import { getTextMiniRipACHIII, toASCII } from './transcriptor/utils'

const txValue = ref('')

const gettet = computed(() => Transpile(txValue.value))

const execute = () => {
  try {
    const result = Transpile(txValue.value, true)
    console.log(result)
  } catch (err) {
    console.error('Error during execution:', err)
  }
}

  onMounted(() => {
    (window as any).getTextMiniRipACHIII = getTextMiniRipACHIII;
    (window as any).toASCII = toASCII;
})
</script>

