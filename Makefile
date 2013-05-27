all: js/bundle.js osmDeepHistory.js

js/bundle.js: index.js package.json js/site.js
	browserify js/site.js > js/bundle.js

osmDeepHistory.js: index.js
	browserify index.js -s osmDeepHistory > osmDeepHistory.js
