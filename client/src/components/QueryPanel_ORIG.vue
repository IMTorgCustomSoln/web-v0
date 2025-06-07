<template>
    <h1>Search</h1>
    <BAccordion flush>
        <BAccordionItem title="Query data" >
            <BForm name="uploadForm" @submit.prevent >
                <BFormGroup label="Document search:" description="" >
                    <BFormInput id="queryInput" placeholder="Where is risk in contract?" v-model="prompts.user" @keyup.enter.prevent="runPreConfigQuery"/>
                    <BButton size="sm" variant="primary" @click="runPreConfigQuery('user')">Submit</BButton>
                    <BButton size="sm" variant="primary" @click="clearQuery('user')">Clear</BButton>
                    <!--<BButton variant="primary" @click="minimizeResultsDisplay('user')">Minimize</BButton>-->
                    <BButton size="sm" v-b-toggle.user-results variant="primary" >Collapse</BButton>
                </BFormGroup>
                <BCollapse id="user-results" visible>
                <BCard>
                    <ul v-for="item in results.user">
                        <li> <strong>{{ item.index }} )</strong> [{{ item.dist }}] {{ item.text }} </li>
                    </ul>
                </BCard>
                </BCollapse>
            </BForm>
        </BAccordionItem>
        <BAccordionItem title="Pre-configured queries" >
            <BCard>
                <BCardText title="Coverage / amounts" style="max-width: 20rem">
                    <BButton size="sm" variant="primary" @click="addSelectedTextToQuery">Add Text</BButton>
                    <BButton size="sm" variant="primary" @click="runPreConfigQuery('coverage')">Update</BButton>
                    <BButton size="sm" v-b-toggle.coverage-results variant="primary" >Collapse</BButton>

                    <BCollapse id="coverage-results" visible>
                    <ul v-for="item in results.coverage">
                        <li> <strong>{{ item.index }} )</strong> [{{ item.dist }}] {{ item.text }} </li>
                    </ul>
                    </BCollapse>
                </BCardText>
            </BCard>
            <BCard>
                <BCardText title="Exclusions" style="max-width: 20rem">
                    <BButton size="sm" variant="primary" @click="runPreConfigQuery('exclusions')">Update</BButton>
                    <BButton size="sm" v-b-toggle.exclusions-results variant="primary" >Collapse</BButton>
                    <BCollapse id="exclusions-results" visible>
                    <ul v-for="item in results.exclusions">
                        <li> <strong>{{ item.index }} )</strong> [{{ item.dist }}] {{ item.text }} </li>
                    </ul>
                    </BCollapse>
                </BCardText>
            </BCard>
            <BCard>
                <BCardText title="Conditions" style="max-width: 20rem">
                    <BButton size="sm" variant="primary" @click="runPreConfigQuery('conditions')">Update</BButton>
                    <BButton size="sm" v-b-toggle.conditions-results variant="primary" >Collapse</BButton>
                    <BCollapse id="conditions-results" visible>
                    <ul v-for="item in results.conditions">
                        <li> <strong>{{ item.index }} )</strong> [{{ item.dist }}] {{ item.text }} </li>
                    </ul>
                    </BCollapse>
                </BCardText>

            </BCard>
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

import { mapStores } from 'pinia'
import { useUserContent } from '@/stores/UserContent'

export default {
    name: 'QueryPanel',
    data() {
        return {
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
            }
        }
    },
    computed: {
        ...mapStores(useUserContent),
    },
    methods: {
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
    }
}

</script>

<style scoped>

.card-text{
    max-width: 100rem;  /*TODO:fix this*/
}

</style>