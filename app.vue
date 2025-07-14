<template>
  <NuxtRouteAnnouncer />  
  <UTextarea v-model="txValue" />
  <hr />
  <pre>{{ gettet }}</pre>
</template>

<script setup lang="ts">
import { Transpile } from './transcriptor/main'

const txValue = defineModel('')

const gettet = computed(() =>  Transpile(txValue.value)
)
</script>
