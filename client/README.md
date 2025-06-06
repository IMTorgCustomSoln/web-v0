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
* use text to modify / refine prompt
* example input

_Phase II_

* create new component for QueryInput.vue button groups
* fix `npm run dev` so workers load
* obfuscate code and cause failure have N+5 days
* use s3 as a static web server
* (maybe) secure s3 with simple password

_Phase III_

* ~~display pdf in viewer~~
* save embeddings with associated document section text to rxdb
* create query input
* embed query input and search against rxdb
