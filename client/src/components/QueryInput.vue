<template>
    <BForm name="uploadForm">
        <BFormGroup label="Query your data:" description="">
            <BFormInput id="queryInput" placeholder="Where is risk in contract?" v-model="queryInput" />
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
import { useAppStore } from '@/stores/app'
import { useUserContent } from '@/stores/UserContent'

export default {
    name: 'QueryInput',
    data() {
        return {
            queryInput: null,
            displayResults: []

        }
    },
    computed: {
        ...mapStores(useAppStore, useUserContent),
    },
    methods: {
        /*TODO:error - reloads page
        @keypress="refReturnKey"

        refReturnKey(e){
            if(e.key==='Enter'){
                this.submitQuery()
            }
        },
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
        },*/
        async submitQuery() {
            console.log(this.queryInput)
            const searchEmbedding = await getVectorFromTextWithWorker(this.queryInput)
            let distances = []
            for (let [idx, docRec] of Object.entries(this.userContentStore.processedFiles)) {
                const vectorObj = await docRec.getVector()
                console.log(vectorObj)
                for (let item of vectorObj.record.vectorRecords) {
                    console.log(item.embedding)
                    let dist = euclideanDistance(searchEmbedding, item.embedding)
                    if (dist != undefined) {
                        item.dist = dist.toFixed(3)
                        distances.push(item)
                    }
                }
            }
            console.log(distances.length)
            let sortedDistances = sortArrayByKey(distances, 'dist', true)
            this.displayResults.splice(0, this.displayResults.length, ...sortedDistances.slice(0, 10));
        }
    }
}

</script>