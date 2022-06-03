<script setup>
const { data: news, pending, error } = await useFetch('https://newsapi.org/v2/everything?q=Apple&from=2022-05-31&sortBy=popularity&apiKey=e34eccb2fd5f440b8edad44ff3ca69be')
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
