<template>
    <BForm name="uploadForm">
        <BFormGroup label="Upload file" description="">
            <BFormInput id="uploadInput" type="file" accept=".pdf" @change="uploadPdfFile" single />
            <BButton variant="primary" @click="uploadInput">Upload</BButton>
            <BButton variant="primary" @click="processData">Process</BButton>
        </BFormGroup>
        <BCard>
            <BCardText title="Card Title" style="max-width: 20rem">
                {{ fileContent }}
            </BCardText>
        </BCard>
        <BFormGroup>
            <QueryInput/>
        </BFormGroup>
        <BCard>
            <PdfDisplay ref="childRef"/>
        </BCard>
    </BForm>
</template>

<script>
import PdfDisplay from '@/components/PdfDisplay.vue'
import QueryInput from '@/components/QueryInput.vue'

import { getVectorFromTextWithWorker } from '@/components/utils/worker-scheduler.js';
import { getFileRecord } from '@/components/utils/pdf_extract.js'
import { getFileReferenceNumber } from './utils/utils';

import { mapStores } from 'pinia'
import { useAppStore } from '@/stores/app'
import { useUserContent } from '@/stores/UserContent'


export default {
    name: 'ImportData',
    components:{
        PdfDisplay,
        QueryInput
    },
    data() {
        return {
            //fileContent: null
            filenames: [],
            importedFiles: []
        }
    },
    computed: {
        ...mapStores(useUserContent, useAppStore),
    },
    methods: {
        /*
        uploadTextFile(event) {
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
        },*/
        uploadPdfFile(event) {
            const file = event.target.files[0];
            this.filenames.push(file)
            console.log(file.name)
        },
        uploadInput() {
            console.log('upload')
            // Load files into records
            if (this.filenames.length > 0) {
                this.uploadFiles.bind(this)(this.filenames).then(
                    (recs) => {
                        this.importedFiles.push(...recs)
                    })
            }
        },
        processData() {
            // Process files by adding / modifying attributes
            const processedFiles = processFiles(this.importedFiles)
            this.userContentStore.processedFiles.push(...processedFiles)

            //this.$emit('imported-records', this.processedFiles)
            //this.disableWorkspaceBtn = true
            //this.resetModal()
            //this.btnText = 'Add More Files'

            //TODO:note
            console.log('process')
            //this.userContentStore.addRecordsFromImport()            //TODO:should this be placed elsewhere?
            //this.appDisplayStore.viewSelection()
            const childComponent = this.$refs.childRef
			if (childComponent) {childComponent.updateDisplay();}
        },
        async uploadFiles(files) {
            // process files selected for upload and return an array of records
            let idx = 0
            const importedFiles = []
            const progress = {
                loaded: 0,
                total: 0
            }
            for (const file of files) {
                const FileStore = {
                    idx: idx,
                    file: file,
                    ctx: this.progressBar
                }
                let record = await getFileRecord(FileStore)

                // file indexing
                record.id = String(idx)

                var re = /(?:\.([^.]+))?$/
                let extension = re.exec(file.name)[1]
                record.filename_original = file.name.replace('.' + extension, '')
                record.filepath = file.webkitRelativePath ? file.webkitRelativePath + '/' + record.filename_original : './' + record.filename_original
                record.filename_modified = null
                record.reference_number = getFileReferenceNumber(file.name)

                // raw
                record.file_extension = extension
                record.filetype = file.type
                record.file_size_mb = file.size
                record.date = file.lastModified

                /*inferred / searchable
                none
        
                //frontend field*/
                record.sort_key = 0     //record.id
                record.hit_count = 0
                record.summary = 'TODO:summary'
                record.snippets = []
                record._showDetails = false

                importedFiles.push(record)
                idx++
            }
            return importedFiles;
        },


    }
}



        function processFiles(files) {
            // process files selected for upload and return an array of records
            const processedFiles = []
            for (const file of files) {
                const check = file.setProcessedFileData()
                if (check) {
                    processedFiles.push(file)
                }
            }
            return processedFiles;
        }

</script>