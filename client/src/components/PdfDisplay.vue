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
                    <BButton @click="reloadPage">Clear Highlights</BButton>
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
            userContent: useUserContent()
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
        'userContent.selectedSnippet': {
            async handler(newSelectedSnippet, oldValue) {
                console.log('hi from selectedSnippet!')
                const check = await this.displayHighlightedResultsItem(newSelectedSnippet)
                console.log(`check displayHighlightedResultsItem: ${check}`)
            },
            deep: true
        },
        'userContent.results': {
            async handler(newResults, oldValue) {
                console.log('hi from results!')
                await this.displayAllHighlightedResults(newResults)
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
            await this.displayAllHighlightedResults()
            return true
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
        async displayAllHighlightedResults() {
            const categories = Object.keys(this.userContentStore.results)
            for (let category of categories) {
                this.displayHighlightedResultsForCategory(category)
            }
        },
        async displayHighlightedResultsForCategory(category) {
            for (let item of this.userContentStore.results[category]) {
                if (parseInt(item.page) == this.currentPage) {
                    //console.log(item.text)
                    let coords = await this.findTextCoordinatesOnCanvas(item.text)
                    if (coords != null) {
                        const rgbColor = this.userContentStore.theme[category]
                        this.highlightTextFromCoords(coords, item, rgbColor)
                    }
                }
            }
        },
        async displayHighlightedResultsItem(item) {
            this.currentPage = parseInt(item.page)
            if (parseInt(item.page) == this.currentPage) {
                let coords = await this.findTextCoordinatesOnCanvas(item.text)
                if (coords != null) {
                    const rgbColor = {red: 255, green: 197, blue: 0}
                    this.highlightTextFromCoords(coords, item, rgbColor)
                    return true
                }
            }
            return false
        },
        async reloadPage() {
            let canvas = document.getElementsByTagName('canvas')[0]
            let ctx = canvas.getContext("2d")
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            await this.updatePage(this.currentPage)
        },


        // logic

        /* Find the coordinates of text if it is rendered on the canvas
        */
        async findTextCoordinatesOnCanvas(searchText) {
            const pageProxy = await this.pdfDocProxy.getPage(this.currentPage)
            const viewport = pageProxy.getViewport({ scale: 1 })
            const textContent = await pageProxy.getTextContent()
            let coords = null
            let textIndex = -1
            while (textIndex == -1) {
                if (searchText.length > 0) {
                    textIndex = textContent.items.findIndex(item => item.str.includes(searchText))
                    searchText = searchText.substring(1)
                } else {
                    return coords
                }
            }
            const textItem = textContent.items[textIndex]
            let input = [textItem.transform[4], textItem.transform[5], textItem.width, textItem.height]
            let canvas_height = viewport.viewBox[3]
            coords = this.convertToCanvasCoords(input, viewport.scale, canvas_height)
            return coords
        },
        /* Highlight text using coordinates to place a canvas context rect
        */
        highlightTextFromCoords(coords, item, rgbColor) {
            const max_dist_cutoff = item.cutoff ? item.cutoff : 0.8
            const opacity_lowerbound = 0.3
            const item_dist = item.dist
            let canvas = document.getElementsByTagName('canvas')[0]
            let ctx = canvas.getContext("2d")
            let opacity = this.determineFillOpacity(max_dist_cutoff, opacity_lowerbound, item_dist)
            ctx.fillStyle = `rgba(${rgbColor[0]}, ${rgbColor[1]}, ${rgbColor[2]}, ${opacity})`
            ctx.fillRect(coords[0], coords[1], coords[2], coords[3])
        },
        /* Get location of cursor-selected text (on canvas) and highlight it

        ref: https://github.com/mozilla/pdf.js/issues/5643    
        ref: https://github.com/mozilla/pdf.js/issues/12031
        */
        async getTextLocation() {
            const pageProxy = await this.pdfDocProxy.getPage(this.currentPage)
            const viewport = pageProxy.getViewport({ scale: 1 })
            const textContent = await pageProxy.getTextContent()
            // search for the text to highlight
            let searchText = window.getSelection().toString()
            let textIndex = textContent.items.findIndex(item => item.str.includes(searchText));
            let selectedRects1 = null
            let selectedRects2 = null
            if (textIndex != -1) {
                // 1) get coordinates of the text
                const textItem = textContent.items[textIndex]
                let input = [textItem.transform[4], textItem.transform[5], textItem.width, textItem.height]
                let scale = 1
                let canvas_height = viewport.viewBox[3]
                let bounds = this.convertToCanvasCoords(input, scale, canvas_height)
                let canvas = document.getElementsByTagName('canvas')[0]
                let ctx = canvas.getContext("2d")
                //ctx.strokeRect(bounds[0],bounds[1],bounds[2],bounds[3])
                ctx.fillStyle = "rgba(255, 197, 0, 0.33)"
                ctx.fillRect(bounds[0], bounds[1], bounds[2], bounds[3])

                // 2) get coordinates of cursor selection
                selectedRects2 = window.getSelection().getRangeAt(0).getClientRects()
                console.log(selectedRects2)
            } else {
                //TODO:continue reducing length of selection until something is hit
            }
            return selectedRects1
        },
        /* Convert bounds to canvas coordinates

        This was very difficult to find references for and does not appear to be an 
        approved process maintained by the owner (mozilla).  This should be explored
        in greater detail when time permits.

        ref: https://github.com/mozilla/pdf.js/issues/5643  
        */
        convertToCanvasCoords([x, y, width, height], scale, canvas_height) {
            //const { scale } = this;
            return [x * scale, canvas_height - ((y + height) * scale), width * scale, height * scale];
        },
        /* Create a Rect Div for highlighting text
        */
        createRectDivForTextHighlight(boundBox, highlightColor) {
            // console.log(randomColor);
            var el = document.createElement('div');
            el.setAttribute('class', 'hiDiv')
            el.setAttribute('style', 'position: absolute; background-color: #' + highlightColor + '; opacity: 0.5;' +
                'left:' + boundBox[0] + 'px; top:' + boundBox[1] + 'px;' +
                'width:' + boundBox[2] + 'px; height:' + boundBox[3] + 'px;');
            return el;
        },
        /* Determine teh opacity given teh distance cutoff and the lowerbound on opacity range.

        This piecewise function is determined by solving the simultaneous equations of a line
        (y=mx+b) for the two required points (0,1) and (cutoff, lowerbound):
            1 = m * 0 + b
            -lwrbnd = m * cutoff + b
        */
        determineFillOpacity(max_dist_cutoff, opacity_lowerbound, item_dist) {
            let opacity = null
            opacity = 1 - (item_dist / max_dist_cutoff)
            /*
            TODO: this fails to properly place line to meet requirement: opacity_lowerbound intersects item_dist
            if (max_dist_cutoff > 1) {
                opacity = 1 - (((max_dist_cutoff - 1) * item_dist) / opacity_lowerbound)
            } else if (max_dist_cutoff < 1) {
                opacity = 1 + (((max_dist_cutoff - 1) * item_dist) / opacity_lowerbound)
            } else if (max_dist_cutoff == 1) {
                alert(`The solution logic is changing max_dist_cutoff from ${max_dist_cutoff} to 0.99 to ensure consistency.`)
                max_dist_cutoff = 0.99
                opacity = 1 + (((max_dist_cutoff - 1) * item_dist) / opacity_lowerbound)
            } else {
                console.log(`ERROR: There was an error in your determineFillOpacity() arguments:
            max_dist_cutoff ${max_dist_cutoff}, opacity_lowerbound ${opacity_lowerbound}, item_dis ${item_dis}
            `)
            }*/
            return opacity
        },
        /* A different approach to highlighting text using cursor selection
        
        This should be compared against other approaches to determine efficacy.
        
        ref: https://gist.github.com/yurydelendik/f2b846dae7cb29c86d23
        */
        async highlightTextFromCursorSelection() {
            const page = parseInt(this.userContentStore['selectedSnippet'].page)
            const pageProxy = await this.pdfDocProxy.getPage(page)

            // Get coordinates of the text
            const viewport = pageProxy.getViewport({ scale: 1 })
            const selectedRects = window.getSelection().getRangeAt(0).getClientRects()
            const r = selectedRects[0]
            //r = selectedRects1

            rect = viewport.convertToPdfPoint(r.left, r.top).concat(
                viewport.convertToPdfPoint(r.right, r.bottom))

            bounds = viewport.convertToViewportRectangle(rect)
            el = document.createElement('div')

            const highlightRect = bounds
            el.style.position = 'absolute';
            el.style.left = highlightRect[0] + 'px';
            el.style.top = highlightRect[1] + 'px';
            el.style.width = highlightRect[2] - highlightRect[0] + 'px';
            el.style.height = highlightRect[3] - highlightRect[1] + 'px';
            el.style.backgroundColor = 'yellow';
            el.style.opacity = '0.5';
            document.body.appendChild(el);
        },
        /* Generate a random color
        */
        generateColor() {
            return Math.floor(Math.random() * 16777215).toString(16);
        },

    }
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