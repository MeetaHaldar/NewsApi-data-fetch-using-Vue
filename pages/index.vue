<script setup>
const { data: news, pending, error } = await useFetch('https://newsapi.org/v2/top-headlines?country=de&category=business&apiKey=e578ddeb9e3e4ae0a612c60c8bf6b9b6')
</script>

<template>
  <div>
    <p v-if="pending">
      Loading....
    </p>
    <p v-else-if="error">
      {{ error }}
    </p>
    <div class="w-9/12  grid grid-cols-1 gap-4  m-auto p-3">
      <CardList v-for="article in news.articles" :key="article.id" :product="article" />
    </div>
  </div>
</template>
