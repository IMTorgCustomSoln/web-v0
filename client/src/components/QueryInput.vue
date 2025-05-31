<template>
    <h1>Results</h1>
    <BAccordion flush>
        <BAccordionItem title="Query data" >
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
        </BAccordionItem>
        <BAccordionItem title="Pre-configured queries" >
            <BCard>
                <BCardText title="Coverage / amounts" style="max-width: 20rem">
                    {{ results.coverage }}
                </BCardText>
            </BCard>
            <BCard>
                <BCardText title="Exclusions" style="max-width: 20rem">
                    {{ results.exclusions }}
                </BCardText>
            </BCard>
            <BCard>
                <BCardText title="Conditions" style="max-width: 20rem">
                    {{ results.conditions }}
                </BCardText>
            </BCard>
        </BAccordionItem>

    </BAccordion>
</template>


<script>
import { getVectorFromTextWithWorker } from '@/components/utils/worker-scheduler';
import { sortArrayByKey, euclideanDistance } from './utils/vector';

import { mapStores } from 'pinia'
import { useUserContent } from '@/stores/UserContent'

export default {
    name: 'QueryInput',
    data() {
        return {
            queryInput: null,
            displayResults: [],
            results: {
                coverage: null,
                exclusions: null,
                conditions: null
            }

        }
    },
    computed: {
        ...mapStores(useUserContent),
    },
    methods: {
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
        },
        async runPreConfigQuery(){
            console.log('hi')
            await this.query()
            const coveragePrompt = 'What is the coverage and amounts?'
            this.submitQuery(coveragePrompt)
        },
        async submitQuery() {
            await this.query()
            console.log(distances.length)
            let sortedDistances = sortArrayByKey(distances, 'dist', true)
            this.displayResults.splice(0, this.displayResults.length, ...sortedDistances.slice(0, 10));
        }
    }
}

</script>