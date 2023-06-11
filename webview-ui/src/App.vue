<script setup lang="ts">
import { vscode } from "./utilities/vscode";
import { ref } from "vue";
import { throttle } from 'lodash'

const keyword = ref("");
const handleSearch = throttle(() => {
  console.log(keyword.value, 'keyword')
  vscode.postMessage({
    method: "search",
    params: keyword.value,
  });
}, 300);
</script>

<template>
  <main class="search-wrapper">
    <textarea class="search-input" placeholder="请输入内容" v-model="keyword" type="text" @input="handleSearch" maxlength="100" />
  </main>
</template>

<style lang="scss">
body {
  height: 100%;
}
.search-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  height: 100%;
  width: 100%;
  .search-input {
    display: inline-flex;
    margin: 10px 0;
    padding: 3px 0 3px 6px;
    width: 100%;
    flex: 1;
    box-sizing: border-box;
    background-color: inherit;
    color: var(--vscode-input-foreground);
  }
}
</style>
