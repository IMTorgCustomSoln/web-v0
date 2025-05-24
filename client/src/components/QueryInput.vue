<template>
    <BForm name="uploadForm">
        <BFormGroup label="Query your data:" description="">
            <BFormInput id="queryInput" placeholder="Where is risk in contract?" v-model="queryInput"/>
            <BButton variant="primary" @click="submitQuery">Submit</BButton>
        </BFormGroup>
        <BCard>
            <ul v-for="item in displayResults">
                <li> <strong>{{ item.index }} )</strong> [{{ item.dist }}] {{ item.text }} </li>
            </ul>
        </BCard>
    </BForm>
</template>


<script>
import { getVectorFromTextWithWorker } from '@/components/utils/worker-scheduler';
import { sortArrayByKey, euclideanDistance } from './utils/vector';

import { mapStores } from 'pinia'
import { useAppStore } from '@/stores/counter'

export default {
    name: 'QueryInput',
    data() {
        return {
            queryInput: null,
            displayResults: []

        }
    },
    computed: {
        ...mapStores(useAppStore),
    },
    methods: {
        /*TODO:error - reloads page
        @keypress="refReturnKey"

        refReturnKey(e){
            if(e.key==='Enter'){
                this.submitQuery()
            }
        },*/
        async submitQuery() {
            console.log(this.queryInput)
            if(this.appStore.docEmbeddings.length == 0){return false}
            const searchEmbedding = await getVectorFromTextWithWorker(this.queryInput)
            let distances = []
            for (let docLine of this.appStore.docEmbeddings) {
                let dist = euclideanDistance(searchEmbedding, docLine.embedding)
                if (dist != undefined) {
                    docLine.dist = dist.toFixed(3)
                    distances.push(docLine)
                }
            }
            console.log(distances.length)
            let sortedDistances = sortArrayByKey(distances, 'dist', true)
            this.displayResults.splice(0, this.displayResults.length, ...sortedDistances.slice(0, 10));
        }
    }
}

</script>