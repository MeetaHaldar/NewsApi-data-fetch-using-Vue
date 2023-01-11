<script>
import { useTimeAgo } from '@vueuse/core'
export default {
  props: {
    product: {
      type: Object,

    },
  },
  methods: {
    timeAgo(date) {
      return useTimeAgo(date)
    },
    showContent(x) {
      return x.replace(/[\(\[].*?[\)\]]/g, '')
    },
    chknullimg(x) {
      if (x == null)
        return ''
      else return x
    },
  },
}
</script>

<template>
  <div class="w-full lg:max-w-full lg:flex">
    <img class="h-48 lg:h-auto lg:w-48 flex-none  rounded-t lg:rounded-t-none lg:rounded-l text-center overflow-hidden" :src="chknullimg(product.urlToImage)" alt="">
    <div class="border-r border-b border-l border-gray-400 lg:border-l-0 lg:border-t lg:border-gray-400 bg-white rounded-b lg:rounded-b-none lg:rounded-r p-4 flex flex-col justify-between leading-normal">
      <div class="mb-8">
        <p class="text-sm text-gray-600 flex items-center">
          Channel :  {{ product.source.name }}
        </p>
        <div class="text-gray-900 font-bold text-xl mb-2">
          {{ product.title }}
        </div>
        <p class="text-gray-700 text-base">
          {{ product.description }}
        </p>
        <p class="text-gray-700 text-sm">
          {{ product.content }} <a :href="product.url" class="text-blue-600">Read more ...</a>
        </p>
      </div>
      <div class="flex items-center">
        <!-- <img class="w-10 h-10 rounded-full mr-4" src="/ben.png" alt="Avatar of Writer"> -->
        <div class="text-sm">
          <p class="text-gray-900 leading-none">
            Author :   {{ product.author }}
          </p>
          <p class="text-gray-600">
            Time :   {{ timeAgo(product.publishedAt) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
