<template>
    <BForm name="uploadForm">
        <BFormInput id="uploadInput" type="file" accept=".md" @change="uploadFile" single />
        <BCard>
            <BCardText
            title="Card Title"
            style="max-width: 20rem"
            >
                {{ fileContent }}
            </BCardText>
        </BCard>
    </BForm>
</template>

<script>
import { getVectorFromTextWithWorker } from '@/components/utils/worker-scheduler.js';

import { mapStores } from 'pinia'
import { useAppStore } from '@/stores/counter'

export default {
    name: 'ImportData',
    data() {
        return {
            fileContent: null
        }
    },
    computed: {
        ...mapStores(useAppStore),
    },
    methods: {
        uploadFile(event) {
            const file = event.target.files[0];
            console.log(file);
            if (file) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    let content = e.target.result; // Store file content
                    this.fileContent = content.split('\n')
                    for(let [index, textLine] of this.fileContent.entries()){
                        const docEmbedding = await getVectorFromTextWithWorker(textLine)
                        this.appStore.docEmbeddings.push({
                            'index': index,
                            'text': textLine,
                            'embedding': docEmbedding
                        })   
                        //save embeddings with document section text to rxdb
                    }
                    console.log( this.appStore.docEmbeddings.length )
                };
                reader.readAsText(file);
            }

        }
    }
}

</script>