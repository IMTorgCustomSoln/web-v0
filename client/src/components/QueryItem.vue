<template>
    <BForm name="uploadForm" @submit.prevent>
        <BFormGroup v-if="displayInput">
            <BInputGroup >
                <BFormInput placeholder="Where is the risk?" v-model="userSubmit"
                    @keyup.enter.prevent="runPreConfigQuery" />
                <BButton size="sm" variant="primary" @click="runPreConfigQuery">Submit</BButton>
            </BInputGroup>   
        </BFormGroup>
        <BFormGroup>
            <BButtonGroup size="sm" >
            {{ title }}
            <BButton v-if="displayInput"  variant="primary" @click="clearQuery">Clear</BButton>
            <BButton v-if="!displayInput" variant="primary" @click="visible = !visible">Collapse</BButton>
            <BButton v-if="!displayInput" variant="primary" @click="addSelectedTextToQuery">Add Selected Text
                to TngData</BButton>
            </BButtonGroup>
        <BCollapse id="results" v-model="visible">
            <BCard>
                <ul v-for="item in results">
                    <li> <strong>{{ item.index }} )</strong> [{{ item.dist }}] {{ item.text }} </li>
                </ul>
            </BCard>
        </BCollapse>
        </BFormGroup>
    </BForm>
</template>

<script>
import { toRaw } from 'vue';
import { getVectorFromTextWithWorker } from '@/components/utils/worker-scheduler';
import { sortArrayByKey, euclideanDistance } from './utils/vector';

import { mapStores } from 'pinia'
import { useUserContent } from '@/stores/UserContent'

export default {
    name: 'QueryItem',
    props: ['displayInput', 'title', 'category'],
    data() {
        return {
            visible: true,
            userSubmit: null,
            prompts: [],
            queryInput: null,
            results: []
        }
    },
    computed: {
        ...mapStores(useUserContent),
    },
    methods: {
        async runPreConfigQuery() {
            this.prompts.push(this.userSubmit)
            const providedPrompts = this.userContentStore['prompts'][this.category]
            this.prompts.push(...providedPrompts)
            const arr = toRaw(this.prompts).filter(function( element ) {
                if (![undefined, null].includes(element)) {
                    return element
                }
            });
            this.queryInput = arr.reduce((acc, item) => acc + ' ' + item)
            const distances = await this.query()
            this.queryInput = null
            this.prepareAndDisplayResults(distances)
        },
        async query() {
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
            return distances
        },
        prepareAndDisplayResults(distances) {
            let sortedDistances = sortArrayByKey(distances, 'dist', true)
            this.results.splice(0, this.results.length, ...sortedDistances.slice(0, 10));
        },
        clearQuery() {
            this.results.length = 0
        },
        addSelectedTextToQuery() {
            const text = window.getSelection().toString()
            if(text.length > 1000){
                alert('Text must be less than 1000 characters')
                return false
            }
            console.log(text)
            this.prompts.push(text)
            return true
        }
    }
}

</script>
