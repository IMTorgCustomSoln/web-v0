<template>
    <div class="page-navigation">
        <BButton :disabled="currentPage <= 1" @click="updatePage('decr')">&larr;</BButton>
        <span>{{ currentPage }}/{{ totalPages }}</span>
        <BButton :disabled="currentPage >= totalPages" @click="updatePage('incr')">&rarr;</BButton>
    </div>
    <div ref="pdfLayersWrapper" class="pdf__layers" :style="{
        height: `${height}px`,
        width: `${width}px`,
        border: '1px solid #dfdfdf',
        margin: '0 auto'
    }">
        <div class="pdf__canvas-layer">
            <canvas ref="canvasLayer" />
        </div>
        <div ref="textLayer" class="pdf__text-layer"></div>
        <div ref="annotationLayer" class="pdf__annotation-layer"></div>
    </div>
</template>

<script>
import { mapStores } from 'pinia'
import { useUserContent } from '@/stores/UserContent'
import { toRaw } from 'vue'

export default {
    name: 'PdfDisplay',
    data() {
        return {
            record: null,
            pdf: null,
            //pageSelection: 1,
            currentPage: 1,
            totalPages: null,

            width: null,
            height: null,
        }
    },
    async mounted() {
        //this.renderDisplay()
        await this.processLoadingTask();
    },
    computed: {
        ...mapStores(useUserContent),
    },
    methods: {
        updateRecord() {
            const records = this.userContentStore.processedFiles
            this.record = records[0]
        },
        async updatePage(newValue) {
            if (newValue == 'incr') {
                this.currentPage = this.currentPage + 1
            }
            else if (newValue == 'decr') {
                this.currentPage = this.currentPage - 1
            }
            const pageProxy = await toRaw(this.pdf).getPage(this.currentPage);
            const { canvasLayer, textLayer, annotationLayer } = this.$refs;
            const viewport = pageProxy.getViewport({ scale: 1 });
            this.renderText(pageProxy, textLayer, viewport);
            this.renderAnnotations(pageProxy, annotationLayer, viewport);
            this.renderCanvas(pageProxy, canvasLayer, viewport);
        },
        async renderText(pdfPageProxy, textLayerContainer, viewport) {
            const { scale } = viewport;
            textLayerContainer.style.setProperty("--scale-factor", `${scale}`);
            textLayerContainer.style.setProperty("--total-scale-factor", `${scale}`);
            const content = await pdfPageProxy.getTextContent()
            return pdfjsLib.renderTextLayer({
                container: textLayerContainer,
                textContentSource: content,
                viewport: viewport.clone({ dontFlip: true })
            });
        },
        async renderCanvas(pdfPageProxy, canvasLayer, viewport) {
            const { width, height, rotation } = viewport;
            this.width = width;
            this.height = height;
            canvasLayer.width = width;
            canvasLayer.height = height;
            const context = canvasLayer.getContext("2d");
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            return pdfPageProxy.render(renderContext);
        },
        async processLoadingTask() {
            this.updateRecord()
            const record = this.record
            if (!record) { return null }
            var dataObj = await record.getDataArray()
            var pdfData = dataObj.record.dataArray

            const loadingTask = await pdfjsLib.getDocument({ data: pdfData, });
            this.pdf = await loadingTask.promise;
            this.totalPages = this.pdf.numPages;
            const page = await toRaw(this.pdf).getPage(this.currentPage)
            const viewport = page.getViewport({ scale: 1 });

            const { canvasLayer, textLayer, annotationLayer } = this.$refs;
            this.renderText(page, textLayer, viewport);
            this.renderAnnotations(page, annotationLayer, viewport);
            return this.renderCanvas(page, canvasLayer, viewport);
        },


        async getAnnotations(pageProxy) {
            const annotations = await pageProxy.getAnnotations({ intent: "display" });
            return annotations;
        },
        async renderAnnotations(pdfPageProxy, annotationLayerContainer, viewport) {
            annotationLayerContainer.replaceChildren();
            const annotations = await this.getAnnotations(pdfPageProxy);
            const clonedViewport = viewport.clone({ dontFlip: true });
            const annotationLayer = new pdfjsLib.AnnotationLayer({
                div: annotationLayerContainer,
                accessibilityManager: undefined,
                annotationCanvasMap: undefined,
                annotationEditorUIManager: undefined,
                page: pdfPageProxy,
                viewport: clonedViewport,
                /* new pdfjs-dist@4.10.38 */
                structTreeLayer: null
            });
            await annotationLayer.render({
                div: annotationLayerContainer,
                viewport: clonedViewport,
                page: pdfPageProxy,
                annotations,
                imageResourcesPath: undefined,
                renderForms: false,
                linkService: new pdfjsViewer.SimpleLinkService(),
                downloadManager: null,
                annotationStorage: undefined,
                enableScripting: false,
                hasJSActions: undefined,
                fieldObjects: undefined
            });
            annotationLayerContainer.addEventListener("click", async (event) => {
                let annotationTarget = event.target.parentNode;
                if (!annotationTarget) {
                    return;
                }
                const id = annotationTarget.dataset.annotationId;
                if (!id) {
                    return;
                }
                const annotationLinkId = annotations.find((ele) => ele.id === id);
                if (!annotationLinkId) {
                    return;
                }
                const pageIndex = await this.pdfDocProxy.getPageIndex(
                    annotationLinkId.dest[0]
                );
                this.currentPage = pageIndex + 1;
            });
        },
        /*
        async updateDisplay() {
            if(!this.record){
            const records = this.userContentStore.processedFiles
            this.record = records[0]
            }
            await this.renderDisplay(this.record, this.pageSelection)
        },
        async renderDisplay(record, pageSelection) {
            if (record) {
                var dataObj = await record.getDataArray()
                var pdfData = dataObj.record.dataArray
            } else {
                // atob() is used to convert base64 encoded PDF to binary-like data.
                // (See also https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/
                // Base64_encoding_and_decoding.)
                var pdfData = atob(
                    'JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwog' +
                    'IC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAv' +
                    'TWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0K' +
                    'Pj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAg' +
                    'L1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSIAogICAgPj4KICA+' +
                    'PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9u' +
                    'dAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2Jq' +
                    'Cgo1IDAgb2JqICAlIHBhZ2UgY29udGVudAo8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJU' +
                    'CjcwIDUwIFRECi9GMSAxMiBUZgooSGVsbG8sIHdvcmxkISkgVGoKRVQKZW5kc3RyZWFtCmVu' +
                    'ZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4g' +
                    'CjAwMDAwMDAwNzkgMDAwMDAgbiAKMDAwMDAwMDE3MyAwMDAwMCBuIAowMDAwMDAwMzAxIDAw' +
                    'MDAwIG4gCjAwMDAwMDAzODAgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9v' +
                    'dCAxIDAgUgo+PgpzdGFydHhyZWYKNDkyCiUlRU9G');
            }
            if (!pageSelection) {
                pageSelection = 1
            }
            //
            // The workerSrc property shall be specified.
            // Fixed using ref: https://github.com/mozilla/pdf.js/discussions/17622
            /*
            pdfjsLib.GlobalWorkerOptions.workerSrc =
                '../../node_modules/pdfjs-dist/build/pdf.worker.mjs';
            
            // Opening PDF by passing its binary data as a string. It is still preferable
            // to use Uint8Array, but string or array-like structure will work too.
            var loadingTask = pdfjsLib.getDocument({ data: pdfData, });
            var pdf = await loadingTask.promise;
            // Fetch the first page.
            this.totalPages = pdf.numPages;
            var page = await pdf.getPage(pageSelection);
            var scale = 1.0;
            var viewport = page.getViewport({ scale: scale, });
            // Support HiDPI-screens.
            var outputScale = window.devicePixelRatio || 1;

            // Prepare canvas using PDF page dimensions.
            var canvas = document.getElementById('the-canvas');
            var context = canvas.getContext('2d');

            canvas.width = Math.floor(viewport.width * outputScale);
            canvas.height = Math.floor(viewport.height * outputScale);
            canvas.style.width = Math.floor(viewport.width) + "px";
            canvas.style.height = Math.floor(viewport.height) + "px";

            var transform = outputScale !== 1
                ? [outputScale, 0, 0, outputScale, 0, 0]
                : null;

            // Render PDF page into canvas context.
            var renderContext = {
                canvasContext: context,
                transform,
                viewport,
            };
            page.render(renderContext);
        }*/
    }
}
</script>

<style>
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}

a,
button,
.badge {
    color: #4fc08d;
}

button,
.badge {
    background: none;
    border: solid 1px;
    border-radius: 2em;
    font: inherit;
    padding: 0.75em 2em;
}

.badge {
    display: inline-block;
    margin-bottom: 1rem;
    margin-top: 1rem;
}

.pdf__layers {
    position: relative;

    .pdf__canvas-layer {
        position: absolute;
        inset: 0;
    }

    .pdf__text-layer {
        inset: 0;
        position: absolute;
        opacity: 1;
        line-height: 1;
        z-index: 5;

        br::selection {
            color: transparent;
        }

        span {
            color: transparent;
            cursor: text;
            position: absolute;
            transform-origin: 0% 0%;
            white-space: pre;

            &::selection {
                background-color: black;
                color: yellow;
            }
        }
    }

    .pdf__annotation-layer {
        position: relative;
        pointer-events: none;

        section {
            position: absolute;
            text-align: initial;
            pointer-events: auto;
            box-sizing: border-box;

            &:not(.popupAnnotation) {
                z-index: 6 !important;
            }

            &:has(div.annotationContent) {
                canvas.annotationContent {
                    display: none;
                }
            }

            a {
                height: 100%;
                left: 0;
                position: absolute;
                top: 0;
                width: 100%;
                cursor: pointer;

                &:hover {
                    background-color: rgba(99, 39, 245, 0.3);
                }
            }
        }
    }
}
</style>