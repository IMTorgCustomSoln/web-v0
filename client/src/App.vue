<script>
import ImportData from '@/components/ImportData.vue'
import QueryInput from '@/components/QueryInput.vue'

export default {
    name: 'App',
    components: {
        ImportData,
        QueryInput
    },
    data() {
        return {}
    }
  }
</script>


<template>
  <header>
    <div class="wrapper">
      <ImportData/>
    </div>
  </header>
  <main>
    <div class="wrapper">
    <QueryInput/>
    </div>
  </main>
</template>

<!-- 
<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  main {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  main .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
-->