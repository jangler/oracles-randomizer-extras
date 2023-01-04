pages/script.js: src/*.ts node_modules
	./node_modules/.bin/esbuild src/index.ts --bundle --outfile=$@

node_modules: package.json
	npm install

clean:
	rm -rf pages/script.js node_modules
