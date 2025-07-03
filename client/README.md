# contract-web

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

This will fail to properly import the worker - must build, first.  There is an error in the worker importing from node_modules: vite converts them to html!

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
simplehttpserver ./dist/
```


# TODO

_Phase I_

* ~~create DocumentRecord in store~~
* ~~create 3 categories of search prompts: coverage + amounts, exclusions, conditions~~
* ~~enable user to select text~~
* ~~improved prompts and scoring~~
* ~~use most current pdfjs-dist~~
* ~~example input~~

_Phase II_

* ~~logic to find and hightlight text~~
* ~~improve highlighting display: PdfDisplay.vue, ln.201: getTextLocation()~~
* ~~add result snippets text highlighting~~
* steps to create for tagging similarity-results (snippets) within pdf
  - ~~add technique for changing to display to correct page~~
  - ~~reduce number of pages vectorized for testing~~
  - ~~fill intensity based on strength of score / distance (closer to zero is darker)~~
  - enable fill with dynamic cutoff
  - ~~enable fill with dynamic color~~
  - duplicates in category results
  - re-write text on top of ctx.fillRect for better visibility
  - ~~add else so that something in the snippet will get hit~~
  - ~~improve split on text (sentencizer for vectorization) better than current split on '.'~~
* still problems
  - for selectedSnippet, mod displayHighlightedResultsItem to outline the text in opacity orange
  - ~~selectSnippet: do pages other than 1 highlight?~~
  - opacity is not right: too dark (dist=0) or too light (dist=cutoff)???
  - query results are not bad, but you have to fiddle with the cutoff: just take the first N=10???
  - display highlight gets too few of the text???
  - need scrolling within QueryItem.vue results, ln.21
* logic to add custom text to modify / refine prompt
* ~~improve setencizer for vectorization~~
* plan to integrate `contract-data` repo
* try graph-rag with `kuzudb`

_Phase III_

* ~~create new component for QueryInput.vue button groups~~
* fix `npm run dev` so workers load
* obfuscate code and cause failure have N+5 days
* use s3 as a static web server
* (maybe) secure s3 with simple password

_Phase III_

* ~~display pdf in viewer~~
* save embeddings with associated document section text to rxdb
* create query input
* embed query input and search against rxdb
