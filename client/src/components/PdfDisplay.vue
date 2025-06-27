<template>
    <div id="container">
        <div class="page-navigation">
            <BButtonToolbar key-nav aria-label="Toolbar with button groups" justify>
                <BButtonGroup class="mx-1" size="sm">
                    <BButton :disabled="currentPage <= 1" @click="--currentPage">&larr;</BButton>
                    <span class="page-btn-grp">{{ currentPage }}/{{ totalPages }}</span>
                    <!--
                    <BButton  :disabled="currentPage >= totalPages" @click="updatePage('incr')">&rarr;</BButton>
                    -->
                    <BButton :disabled="currentPage >= totalPages" @click="++currentPage">&rarr;</BButton>
                </BButtonGroup>

                <BButtonGroup class="mx-1" size="sm" placement="right">
                    <BButton @click="highlightText">Hightlight Text</BButton>
                    <!--TODO 
                    ~~ <BButton @click="extractTextRadio">Select Text ({{ formatBoolean(this.extractText) }})</BButton> ~~
                    -->
                </BButtonGroup>
            </BButtonToolbar>
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
            //pdfDocProxy: null,
            pdfPageProxy: null,
            //pageSelection: 1,
            currentPage: 1,
            totalPages: null,

            width: null,
            height: null,

            extractText: true,
        }
    },
    async mounted() {
        //this.renderDisplay()
        await this.processLoadingTask();
    },
    watch: {
        async currentPage(newValue) {
            await this.updatePage(newValue)
        },
        'useUserContent.getSelectedSnippet':{
            handler(newValue, oldValue) {
            // Perform actions when 'anotherObject' or its nested properties change
            console.log('hi from pdfDisplay!')
            console.log(newValue)
          },
          deep: true
        },
    },
    computed: {
        ...mapStores(useUserContent),
        //changeInStateSelectedSnippet() { return useUserContent.getSelectedSnippet }
    },
    methods: {
        // page
        updateRecord() {
            const records = this.userContentStore.processedFiles
            this.record = records[0]
        },
        async processLoadingTask() {
            this.updateRecord()
            const record = this.record
            if (!record) { return null }
            var dataObj = await record.getDataArray()
            var pdfData = dataObj.record.dataArray

            const loadingTask = await pdfjsLib.getDocument({ data: pdfData, });
            const pdf = await loadingTask.promise;
            this.pdfDocProxy = pdf
            this.totalPages = this.pdfDocProxy.numPages;

            const pageProxy = await toRaw(this.pdfDocProxy).getPage(this.currentPage)
            this.$refs.pdfLayersWrapper.style.setProperty("--total-scale-factor", `${1}`)
            const viewport = pageProxy.getViewport({ scale: 1 });
            const { canvasLayer, textLayer, annotationLayer } = this.$refs;

            this.renderText(pageProxy, textLayer, viewport);
            this.renderAnnotations(pageProxy, annotationLayer, viewport);
            return this.renderCanvas(pageProxy, canvasLayer, viewport);
        },
        async updatePage(page) {
            const pageProxy = await this.pdfDocProxy.getPage(page);
            const { canvasLayer, textLayer, annotationLayer } = this.$refs;
            const viewport = pageProxy.getViewport({ scale: 1 });

            this.renderText(pageProxy, textLayer, viewport);
            this.renderAnnotations(pageProxy, annotationLayer, viewport);
            this.renderCanvas(pageProxy, canvasLayer, viewport);
        },

        // layers
        async renderText(pdfPageProxy, textLayerContainer, viewport) {
            textLayerContainer.replaceChildren()
            const content = await pdfPageProxy.getTextContent()
            const renderTask = new pdfjsLib.TextLayer({
                container: textLayerContainer,
                textContentSource: content,
                viewport: viewport.clone({ dontFlip: true })
            });
            await renderTask.render();

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
        async getAnnotations(pageProxy) {
            const annotations = await pageProxy.getAnnotations({ intent: "display" });
            return annotations;
        },
        async renderAnnotations(pdfPageProxy, annotationLayerContainer, viewport) {
            annotationLayerContainer.replaceChildren();
            annotationLayerContainer.width = this.width;
            annotationLayerContainer.height = this.height;
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


        // functionality
        async getTextLocation() {
            const page = parseInt(this.userContentStore['selectedSnippet'].page)
            const searchText = this.userContentStore['selectedSnippet'].text
            const pageProxy = await this.pdfDocProxy.getPage(page)
            const textContent = await pageProxy.getTextContent()

            // Search for the text to highlight
            var textIndex = textContent.items.findIndex(item => item.str.includes(searchText.substr(10, 5)));
            //if (textIndex != -1) {
            if (true) {
                // Get coordinates of the text
                //let textItem = textContent.items[textIndex]
                const viewport = pageProxy.getViewport({ scale: 1 })
                const selectedRects = window.getSelection().getRangeAt(0).getClientRects()
            }
            return selectedRects
        },
        // ref: https://gist.github.com/yurydelendik/f2b846dae7cb29c86d23
        async highlightText() {
            const page = parseInt(this.userContentStore['selectedSnippet'].page)
            const pageProxy = await this.pdfDocProxy.getPage(page)

            // Get coordinates of the text
            const viewport = pageProxy.getViewport({ scale: 1 })
            const selectedRects = window.getSelection().getRangeAt(0).getClientRects()
            const r = selectedRects[0]

            const rect = viewport.convertToPdfPoint(r.left, r.top).concat(
                viewport.convertToPdfPoint(r.right, r.bottom))

            const bounds = viewport.convertToViewportRectangle(rect)
            const el = document.createElement('div')

            const highlightRect = bounds
            el.style.position = 'absolute';
            el.style.left = highlightRect[0] + 'px';
            el.style.top = highlightRect[1] + 'px';
            el.style.width = highlightRect[2] - highlightRect[0] + 'px';
            el.style.height = highlightRect[3] - highlightRect[1] + 'px';
            el.style.backgroundColor = 'yellow';
            el.style.opacity = '0.5';
            document.body.appendChild(el);
        }
    },
    generateColor() {
        return Math.floor(Math.random() * 16777215).toString(16);
    },
    createRectDiv(boundBox, highlightColor) {
        // console.log(randomColor);
        var el = document.createElement('div');
        el.setAttribute('class', 'hiDiv')
        el.setAttribute('style', 'position: absolute; background-color: #' + highlightColor + '; opacity: 0.5;' +
            'left:' + boundBox[0] + 'px; top:' + boundBox[1] + 'px;' +
            'width:' + boundBox[2] + 'px; height:' + boundBox[3] + 'px;');
        return el;
    },
}




</script>


<style>
.page-btn-grp {
    padding-left: 20px;
    padding-right: 20px;
}



#container {
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

/* Note: layers will fail without proper css
annotationLayer must be on top | index: 6 */
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
        inset: 0;
        position: absolute;
        pointer-events: none;
        z-index: 6 !important;

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