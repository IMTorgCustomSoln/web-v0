//import './assets/main.css'

import { createApp } from 'vue'
import {createBootstrap} from 'bootstrap-vue-next'
import {pinia} from '@/stores/config_stores'

//css
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'

//pdf
import * as pdfjsLib from "pdfjs-dist/build/pdf"
//import *  as pdfjsViewer from "pdfjs-dist/web/pdf_viewer"
import * as pdfjsWorker from "pdfjs-dist/build/pdf.worker.js"
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

import App from './App.vue'

const app = createApp(App)
app.use(createBootstrap())
app.use(pinia)

app.mount('#app')
