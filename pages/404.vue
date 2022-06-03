<script setup lang="ts">
import CarbonWarning from '~icons/carbon/warning'

const router = useRouter()
</script>

<template>
  <main class="text-center text-teal-700 dark:text-gray-200">
    <div text-4xl>
      <CarbonWarning class="inline-block" />
    </div>
    <div>Not found</div>
    <div>
      <button type="button" class="text-sm m-3" @click="router.back()">
        Back
      </button>
    </div>
  </main>
</template>

<!-- https://newsapi.org/v2/everything?q=Apple&from=2022-05-31&sortBy=popularity&apiKey=e34eccb2fd5f440b8edad44ff3ca69be -->