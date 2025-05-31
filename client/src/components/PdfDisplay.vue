<template>
    <canvas id="the-canvas" style="border: 1px solid black; direction: ltr;"></canvas>
</template>

<script>
import { mapStores } from 'pinia'
import { useUserContent } from '@/stores/UserContent'

export default {
    name: 'PdfDisplay',
    data() {
        return {}
    },
    mounted() {
        runDisplay()
    },
    computed: {
        ...mapStores(useUserContent),
    },
    methods:{
        updateDisplay() {
            const record = this.userContentStore.processedFiles
            runDisplay(record[0])
        },
    }
}

async function runDisplay(record, pageSelection) {
    if (record) {
        var dataObj = await record.getDataArray()
        var pdfData = dataObj['dataArray']
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
    if(!pageSelection){
        var pageSelection = 1
    }
    //
    // The workerSrc property shall be specified.
    //
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        '../../node_modules/pdfjs-dist/build/pdf.worker.mjs';

    // Opening PDF by passing its binary data as a string. It is still preferable
    // to use Uint8Array, but string or array-like structure will work too.
    var loadingTask = pdfjsLib.getDocument({ data: pdfData, });
    var pdf = await loadingTask.promise;
    // Fetch the first page.
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
}

</script>