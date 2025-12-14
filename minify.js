#!/usr/bin/env node

const fs = require('fs');
const { minify } = require('terser');

const inputFile = 'bookmarklet.js';
const outputFile = 'bookmarklet.url';

async function createBookmarklet() {
	try {
		// 1. Read the input file
		const code = fs.readFileSync(inputFile, 'utf8');
		
		// 2. Minify using Terser
		// Terser is smart: it handles ASI (semicolons), removes comments,
		// and safely shortens variable names to save space.
		const result = await minify(code, {
			mangle: true, // Shorten variable names (var count -> var a)
			compress: {
				sequences: true, // Join consecutive statements with commas
				dead_code: true, // Remove unreachable code
				conditionals: true, // Optimize ifs
				booleans: true, // Optimize boolean expressions
				unused: true, // Drop unused variables
			}
		});
		
		if (result.error) {
			throw result.error;
		}
		
		// 3. Wrap in IIFE and format as bookmarklet protocol
		// encodeURIComponent is usually safer for arbitrary code, but standard 
		// bookmarklets often just escape spaces to keep it readable. 
		// We will use a hybrid approach: simple encoding that browsers accept.
		const bookmarklet = `javascript:(function(){${result.code}})();`;
		
		// 4. Write output
		fs.writeFileSync(outputFile, bookmarklet);
		
		console.log(`✨ Success: wrote [${bookmarklet.length}/${code.length}] bytes to [${outputFile}]:`);
		console.log(bookmarklet.substring(0, 80) + '...');
		
	} catch (error) {
		console.error('🤖 Error:', error.message);
		if (error.line) {
			console.error(`   at line ${error.line}:${error.col}`);
		}
	}
}

createBookmarklet();

