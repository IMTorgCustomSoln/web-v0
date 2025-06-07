<template>
    <h1>Search</h1>

            <BButtonGroup class="mx-1" size="sm" placement="right">
                <BButton variant="primary" @click="showTngData = !showTngData">Training</BButton>
                <BOffcanvas v-model="showTngData" placement="end"/>
            </BButtonGroup>

    <BAccordion flush>
        <BAccordionItem title="Query data">
            <QueryItem :displayInput=true title="" category="user" />
        </BAccordionItem>
        <BAccordionItem title="Pre-configured queries">
            <QueryItem :displayInput=false title="Coverage" category="coverage" ref="itemConverage" />
            <QueryItem :displayInput=false title="Exclusions" category="exclusions" ref="itemExclusions" />
            <QueryItem :displayInput=false title="Conditions" category="conditions" ref="itemConditions" />
        </BAccordionItem>
    </BAccordion>

</template>


<script>
/* References
    - https://blog.vue-pdf-viewer.dev/what-are-pdfjs-layers-and-how-you-can-use-them-in-vuejs?source=more_articles_bottom_blogs
    - 
*/
import { toRaw } from 'vue';
import { getVectorFromTextWithWorker } from '@/components/utils/worker-scheduler';
import { sortArrayByKey, euclideanDistance } from './utils/vector';



import QueryItem from '@/components/QueryItem.vue'

import { mapStores } from 'pinia'
import { useUserContent } from '@/stores/UserContent'

export default {
    name: 'QueryPanel',
    components: { QueryItem },
    data() {
        return {
            showTngData: false,
            /*
            queryInput: null,
            //TODO: change structure to something like: `user{display:true, prompts:[], results:[]}`
            display:{
                user: true,
                coverage: true,
                exclusions: true,
                conditions: true,
            },
            prompts:{
                user: [],
                coverage:[
                    'What is the coverage?', 
                    'What is the amount?'
                ],
                exclusions:[
                    'What exclusions are there?'
                ],
                conditions:[
                    'What conditions are there?'
                ]
            },
            results: {
                user: [],
                coverage: [],
                exclusions: [],
                conditions: []
            }*/
        }
    },
    computed: {
        ...mapStores(useUserContent),
    },
    methods: {
        async runPreConfigQuery() {
            for (let [key, ref] of Object.entries(this.$refs)) {
                ref.runPreConfigQuery()
            }
        },
        /*
        getQueryDataStructures(queryType, attr){
            return this[attr][queryType]
        },
        async query(){
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
        prepareAndDisplayResults(distances, queryType){
            let sortedDistances = sortArrayByKey(distances, 'dist', true)
            const dataStruct = this.getQueryDataStructures(queryType, 'results')
            dataStruct.splice(0, dataStruct.length, ...sortedDistances.slice(0, 10));    
        },
        async runPreConfigQuery(promptCategory){
            this.queryInput = null
            const dataStruct = this.getQueryDataStructures(promptCategory, 'prompts')
            let tmp = null
            if(typeof(dataStruct)=='string'){
                tmp = [toRaw(dataStruct)]
            } else {
                tmp = toRaw(dataStruct)
            }
            this.queryInput = tmp.reduce((acc, item) => acc + ' ' + item)
            const distances = await this.query()
            this.queryInput = null
            this.prepareAndDisplayResults(distances, promptCategory)
        },
        clearQuery(queryType){
            const dataStruct = this.getQueryDataStructures(queryType, 'results')
            dataStruct.length = 0
        },
        minimizeResultsDisplay(queryType){
            let dataStruct = this.getQueryDataStructures(queryType, 'display')
            dataStruct = !dataStruct
        },
        addSelectedTextToQuery(){
            const text = window.getSelection().toString()
            console.log(text)
            console.log('but where to put it???')
            return true
        }
        */
    }
}

</script>

<style scoped>
.card-text {
    max-width: 100rem;
    /*TODO:fix this*/
}
</style>