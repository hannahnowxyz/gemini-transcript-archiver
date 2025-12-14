#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// --- CONSTANTS ---
const ASSETS_DIR = 'assets';
const ARCHIVES_DIR = 'archives';

// --- ARGUMENT PARSING ---
const ARGS = {
	title: "Gemini Archive",
	inputFile: 'transcript.html',
	outputFile: path.join(ARCHIVES_DIR, 'sparkles.html'),
	monoFontPath: null
};

const rawArgs = process.argv.slice(2);
for (let i = 0; i < rawArgs.length; i++) {
	const arg = rawArgs[i];
	if (arg === '-t' || arg === '--title') ARGS.title = rawArgs[++i];
	else if (arg.startsWith('--title=')) ARGS.title = arg.split('=')[1];
	else if (arg === '-s' || arg === '--src') ARGS.inputFile = rawArgs[++i];
	else if (arg.startsWith('--src=')) ARGS.inputFile = arg.split('=')[1];
	else if (arg === '-o' || arg === '--out') ARGS.outputFile = rawArgs[++i];
	else if (arg.startsWith('--out=')) ARGS.outputFile = arg.split('=')[1];
	else if (arg.startsWith('--monofont=')) ARGS.monoFontPath = arg.split('=')[1];
}

if (path.resolve(ARGS.inputFile) === path.resolve(ARGS.outputFile)) {
	console.error("❌ Error: Output file must be different from input file.");
	process.exit(1);
}

// --- CONFIGURATION ---
const CONFIG = {
	cssFile: 'injectme.css',
	jsFile: 'injectme.js',
	resources: {
		googleSansFlex: 'https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@8..144,100..1000&display=swap',
		googleSansMono: 'https://fonts.googleapis.com/css2?family=Google+Sans+Mono:wght@400;500;700&display=swap',
		iconsCss: 'https://fonts.googleapis.com/icon?family=Material+Icons',
		mathjax: 'https://cdn.jsdelivr.net/npm/mathjax@4/tex-mml-chtml.js',
	},
	localPaths: {
		gemini: path.join(ASSETS_DIR, 'gemini-icon.svg'),
		sparkle: path.join(ASSETS_DIR, 'noto-emoji-sparkles.svg'),
		mathjax: path.join(ASSETS_DIR, 'mathjax4.js')
	}
};

// --- ASSET HELPERS ---

if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR);
if (!fs.existsSync(ARCHIVES_DIR)) fs.mkdirSync(ARCHIVES_DIR);

const GEMINI_SVG = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="width:100%;height:100%;content-visibility:visible" viewBox="0 0 32 32"><defs><linearGradient id="a" x1="-33" x2="31" y1="26" y2="-28" gradientUnits="userSpaceOnUse" spreadMethod="pad"><stop offset="0%" stop-color="#346BF1"/><stop offset="22%" stop-color="#3279F8"/><stop offset="45%" stop-color="#3186FF"/><stop offset="72%" stop-color="#4093FF"/><stop offset="99%" stop-color="#4FA0FF"/></linearGradient><linearGradient id="e" x1="-33" x2="31" y1="26" y2="-28" gradientUnits="userSpaceOnUse" spreadMethod="pad"><stop offset="0%" stop-color="#346BF1"/><stop offset="22%" stop-color="#3279F8"/><stop offset="45%" stop-color="#3186FF"/><stop offset="72%" stop-color="#4093FF"/><stop offset="99%" stop-color="#4FA0FF"/></linearGradient><clipPath id="c"><path d="M0 0h32v32H0z"/></clipPath><path id="b" fill="url(#a)" d="M-3.9-84.95c-1.38 5.48-3.18 10.81-5.42 16.02-5.84 13.56-13.84 25.43-24.01 35.6-10.17 10.16-22.04 18.17-35.6 24.01-5.2 2.24-10.54 4.04-16.02 5.42C-86.74-3.45-88-1.85-88 0s1.26 3.45 3.05 3.9c5.48 1.38 10.81 3.18 16.02 5.42 13.56 5.84 25.42 13.84 35.6 24.01 10.17 10.17 18.18 22.04 24.01 35.6 2.24 5.2 4.04 10.54 5.42 16.02C-3.45 86.74-1.84 88 0 88c1.85 0 3.45-1.26 3.9-3.05 1.38-5.48 3.18-10.81 5.42-16.02 5.84-13.56 13.84-25.42 24.01-35.6C43.5 23.16 55.37 15.15 68.93 9.32c5.2-2.24 10.54-4.04 16.02-5.42C86.74 3.45 88 1.84 88 0c0-1.85-1.26-3.45-3.05-3.9-5.48-1.38-10.81-3.18-16.02-5.42-13.56-5.84-25.42-13.84-35.6-24.01C23.16-43.5 15.15-55.37 9.32-68.93c-2.24-5.2-4.04-10.54-5.42-16.02C3.45-86.74 1.85-88 0-88s-3.45 1.26-3.9 3.05z" display="block" transform="matrix(.1248 0 0 .1248 16 16)"/><mask id="d" mask-type="alpha"><use xlink:href="#b"/></mask></defs><g clip-path="url(#c)" display="block" mask="url(#d)"><path fill="url(#e)" d="M-14.654 174.771 174.771 14.654 14.654-174.771-174.771-14.654l160.117 189.425z" transform="matrix(.1248 0 0 .1248 16 16)"/></g></svg>`;
const SPARKLE_SVG = `<svg width="800" height="800" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="iconify iconify--noto"><path d="m121.59 60.83-13.93-4.49c-8.91-2.94-14.13-10.15-16.58-19.21L84.95 7.27c-.16-.59-.55-1.38-1.75-1.38-1.01 0-1.59.79-1.75 1.38l-6.13 29.87c-2.46 9.06-7.67 16.27-16.58 19.21l-13.93 4.49c-1.97.64-2 3.42-.04 4.09l14.03 4.83c8.88 2.95 14.06 10.15 16.52 19.17l6.14 29.53c.16.59.49 1.65 1.75 1.65 1.33 0 1.59-1.06 1.75-1.65l6.14-29.53c2.46-9.03 7.64-16.23 16.52-19.17l14.03-4.83c1.94-.68 1.91-3.46-.06-4.1" fill="#fdd835"/><path d="M122.91 62.08c-.22-.55-.65-1.03-1.32-1.25l-13.93-4.49c-8.91-2.94-14.13-10.15-16.58-19.21L84.95 7.27c-.09-.34-.41-.96-.78-1.14l1.98 29.97c1.47 13.68 2.73 20.12 13.65 22 9.38 1.62 20.23 3.48 23.11 3.98" fill="#ffee58"/><path d="m122.94 63.64-24.16 5.54c-8.51 2.16-13.2 7.09-13.2 19.99l-2.37 30.94c.81-.08 1.47-.52 1.75-1.65l6.14-29.53c2.46-9.03 7.64-16.23 16.52-19.17l14.03-4.83c.66-.24 1.08-.73 1.29-1.29" fill="#f4b400"/><path d="M41.81 86.81c-8.33-2.75-9.09-5.85-10.49-11.08l-3.49-12.24c-.21-.79-2.27-.79-2.49 0L22.97 74.8c-1.41 5.21-4.41 9.35-9.53 11.04l-8.16 3.54c-1.13.37-1.15 1.97-.02 2.35l8.22 2.91c5.1 1.69 8.08 5.83 9.5 11.02l2.37 10.82c.22.79 2.27.79 2.48 0l2.78-10.77c1.41-5.22 3.57-9.37 10.5-11.07l7.72-2.91c1.13-.39 1.12-1.99-.02-2.36z" fill="#fdd835"/><path d="M28.49 75.55c.85 7.86 1.28 10.04 7.65 11.67l13.27 2.59c-.14-.19-.34-.35-.61-.43l-7-2.57c-7.31-2.5-9.33-5.68-10.7-12.04s-2.83-10.51-2.83-10.51c-.51-1.37-1.24-1.3-1.24-1.3z" fill="#ffee58"/><path d="M28.73 102.99c0-7.41 4.05-11.08 10.49-11.08l10.02-.41s-.58.77-1.59 1.01l-6.54 2.13c-5.55 2.23-8.08 3.35-9.8 10.94 0 0-2.22 8.83-2.64 9.76-.58 1.3-1.27 1.57-1.27 1.57z" fill="#f4b400"/><path d="M59.74 28.14c.56-.19.54-.99-.03-1.15l-7.72-2.08a4.77 4.77 0 0 1-3.34-3.3L45.61 9.06c-.15-.61-1.02-.61-1.17.01l-2.86 12.5a4.73 4.73 0 0 1-3.4 3.37l-7.67 1.99c-.57.15-.61.95-.05 1.15l8.09 2.8c1.45.5 2.57 1.68 3.01 3.15l2.89 11.59c.15.6 1.01.61 1.16 0l2.99-11.63a4.77 4.77 0 0 1 3.04-3.13z" fill="#f4b400" stroke="#f4b400" stroke-miterlimit="10"/></svg>`;

function ensureAssetFile(filePath, content) {
	if (!fs.existsSync(filePath)) {
		fs.writeFileSync(filePath, content, 'utf8');
	}
}

async function smartFetch(url) {
	const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };
	const response = await fetch(url, { headers });
	if (!response.ok) throw new Error(`Failed to fetch ${url} - Status: ${response.status}`);
	return response;
}

async function fetchAndCache(url, localPath, isBinary = false) {
	if (fs.existsSync(localPath)) return fs.readFileSync(localPath, isBinary ? null : 'utf8');
	const response = await smartFetch(url);
	const buffer = Buffer.from(await response.arrayBuffer());
	fs.writeFileSync(localPath, buffer);
	return isBinary ? buffer : buffer.toString('utf8');
}

async function processCssAssets(cssContent) {
	const urlRegex = /url\(([^)]+)\)/g;
	let match;
	const tasks = [];
	const replacements = new Map();
	
	while ((match = urlRegex.exec(cssContent)) !== null) {
		let rawUrl = match[1].replace(/['"]/g, '').trim();
		if (rawUrl.startsWith('//')) rawUrl = 'https:' + rawUrl;
		if (replacements.has(rawUrl)) continue;
		
		const filename = path.basename(new URL(rawUrl).pathname);
		const localPath = path.join(ASSETS_DIR, filename);
		
		tasks.push((async () => {
			try {
				const fileBuffer = await fetchAndCache(rawUrl, localPath, true);
				const base64 = fileBuffer.toString('base64');
				const dataUri = `data:font/woff2;base64,${base64}`;
				replacements.set(rawUrl, dataUri);
			} catch (err) { console.warn(`⚠️ Failed to download asset: ${rawUrl}`); }
		})());
	}
	
	if (tasks.length > 0) await Promise.all(tasks);
	
	let newCss = cssContent;
	for (const [url, dataUri] of replacements.entries()) {
		const safeUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const regex = new RegExp(`url\\(['"]?${safeUrl}['"]?\\)`, 'g');
		newCss = newCss.replace(regex, `url('${dataUri}')`);
	}
	return newCss;
}

function escapeHtml(str) {
	if (!str) return '';
	return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

async function finalizeTranscript() {
	console.log(`🚀 Generating "${ARGS.title}"...`);
	console.log(`📖 Input: ${ARGS.inputFile}`);
	
	ensureAssetFile(CONFIG.localPaths.gemini, GEMINI_SVG);
	ensureAssetFile(CONFIG.localPaths.sparkle, SPARKLE_SVG);
	
	let rawHtml, userCss, userJs;
	try {
		rawHtml = fs.readFileSync(ARGS.inputFile, 'utf8');
		userCss = fs.readFileSync(CONFIG.cssFile, 'utf8');
		userJs = fs.readFileSync(CONFIG.jsFile, 'utf8');
	} catch (err) {
		console.error("❌ Missing source files.", err.message);
		return;
	}
	
	console.log("Processing Fonts...");
	const fontCssRaw = await fetchAndCache(CONFIG.resources.googleSansFlex, path.join(ASSETS_DIR, 'google-sans.css'));
	const fontCssInlined = await processCssAssets(fontCssRaw);
	
	let monoCssInlined = '';
	if (ARGS.monoFontPath) {
		try {
			const fontData = fs.readFileSync(ARGS.monoFontPath);
			monoCssInlined = `@font-face { font-family: 'Google Sans Mono'; src: url('data:font/woff2;base64,${fontData.toString('base64')}') format('woff2'); font-weight: 400 700; font-style: normal; }`;
		} catch (e) { console.error(`Failed to load custom font: ${e.message}`); }
	} else {
		const monoCssRaw = await fetchAndCache(CONFIG.resources.googleSansMono, path.join(ASSETS_DIR, 'google-sans-mono.css'));
		monoCssInlined = await processCssAssets(monoCssRaw);
	}
	
	console.log("Processing Icons...");
	const iconsCssRaw = await fetchAndCache(CONFIG.resources.iconsCss, path.join(ASSETS_DIR, 'icons.css'));
	const iconsCssInlined = await processCssAssets(iconsCssRaw);
	
	const geminiDataUri = `data:image/svg+xml;base64,${fs.readFileSync(CONFIG.localPaths.gemini).toString('base64')}`;
	const sparkleDataUri = `data:image/svg+xml;base64,${fs.readFileSync(CONFIG.localPaths.sparkle).toString('base64')}`;
	
	console.log("Processing MathJax...");
	const mathJaxDataUri = `data:text/javascript;base64,${Buffer.from(await fetchAndCache(CONFIG.resources.mathjax, CONFIG.localPaths.mathjax)).toString('base64')}`;
	
	const $in = cheerio.load(rawHtml);
	const $items = $in('user-query, model-response');
	
	console.log(`🔍 Processing ${$items.length} conversation items...`);
	
	const $out = cheerio.load(`
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${escapeHtml(ARGS.title)}</title>
	<link rel="icon" type="image/svg+xml" href="${geminiDataUri}">
	<style>
		${fontCssInlined}
		${monoCssInlined}
		${iconsCssInlined}
		${userCss}
	</style>
</head>
<body class="dark-theme">
	<div id="chat-container"></div>
	<script src="${mathJaxDataUri}"></script>
	<script>
		window.ASSETS = { sparkleIcon: "${sparkleDataUri}" };
		${userJs}
	</script>
</body>
</html>
	`);
	
	const $container = $out('#chat-container');
	
	// Helper to process math delimiters in a Cheerio object
	const processMath = ($scope) => {
		$scope.find('span.math-inline').each((_, el) => {
			const $el = $in(el);
			const tex = $el.attr('data-math');
			if (tex) $el.replaceWith(escapeHtml(`\\(${tex}\\)`));
		});
		$scope.find('div.math-block, .math-display').each((_, el) => {
			const $el = $in(el);
			const tex = $el.attr('data-math');
			if (tex) $el.replaceWith(escapeHtml(`$$${tex}$$`));
		});
	};
	
	$items.each((i, el) => {
		const tagName = el.tagName.toLowerCase();
		const $el = $in(el);
		
		if (tagName === 'user-query') {
			const $content = $el.find('.query-content, .user-query-text, .ry3kXd').first();
			let $target = $content.length ? $content : $el;
			
			// Process Math
			processMath($target);
			
			// Process Newlines
			$target.find('br, div, p').before('\n'); 
			
			let userText = $target.text().trim().replace(/\n{3,}/g, '\n\n');
			
			const userRow = `
			<div class="message-row user">
				<div class="user-bubble expanded">
					<div class="bubble-content">${escapeHtml(userText)}</div>
					<div class="bubble-controls">
						<button class="toggle-btn" title="Toggle Expand">
							<span class="material-icons">unfold_less</span>
						</button>
						<button class="user-copy-btn" title="Copy">
							<span class="material-icons">content_copy</span>
						</button>
					</div>
				</div>
			</div>`;
			$container.append(userRow);
			
		} else if (tagName === 'model-response') {
			const $thoughts = $el.find('model-thoughts, .model-thoughts, .thought-process');
			let thoughtHtml = '';
			
			if ($thoughts.length > 0) {
				// Process Math in thoughts
				processMath($thoughts);
				const thoughtText = $thoughts.find('.thoughts-content, .content').html() || $thoughts.html();
				if (thoughtText) {
					thoughtHtml = `
					<div class="thought-block collapsed">
						<div class="thought-header">
							<span class="material-icons icon">auto_awesome</span>
							<span class="label">Show thinking</span>
							<span class="material-icons toggle">expand_more</span>
						</div>
						<div class="thought-content">${thoughtText}</div>
					</div>`;
				}
			}
			
			let $contentDiv = $el.find('.model-response-text, .markdown-content, .message-content');
			if ($contentDiv.length === 0) $contentDiv = $el;
			
			// Process Math in main content
			processMath($contentDiv);
			
			$contentDiv.find('*').each((j, node) => {
				const attribs = node.attribs || {};
				for (const attr in attribs) {
					if (attr.startsWith('_ng') || attr.startsWith('ng-') || attr.startsWith('js')) {
						$in(node).removeAttr(attr);
					}
				}
				if (node.tagName === 'button' || node.tagName === 'mat-icon') $in(node).remove();
			});
			
			// Reconstruct Code Blocks
			const processBlock = (pre, langLabelOverride = null) => {
				const $pre = $in(pre);
				const $code = $pre.find('code');
				let langLabel = langLabelOverride;
				
				if (!langLabel) {
					const langClass = $code.attr('class') || '';
					const langMatch = langClass.match(/language-(\w+)/);
					langLabel = langMatch ? langMatch[1] : 'Code';
					
					if (langLabel.toLowerCase() === 'c' || langLabel.toLowerCase() === 'cpp') langLabel = 'C';
					else if (langLabel.toLowerCase() === 'python') langLabel = 'Python';
					else langLabel = langLabel.charAt(0).toUpperCase() + langLabel.slice(1);
				}
				
				$pre.replaceWith(`
					<div class="code-wrapper">
						<div class="code-header">
							<span class="lang-label">${escapeHtml(langLabel)}</span>
							<button class="copy-btn">
								<span class="material-icons">content_copy</span>
							</button>
						</div>
						<pre><code>${$code.html() || $pre.html()}</code></pre>
					</div>
				`);
			};
			
			// FIX: Iterate code-blocks but check for labels carefully
			$contentDiv.find('code-block').each((j, elem) => {
				const $block = $in(elem);
				const $dec = $block.find('.code-block-decoration span').first();
				const label = $dec.length ? $dec.text().trim() : null;
				const $innerPre = $block.find('pre');
				
				if ($innerPre.length) processBlock($innerPre[0], label);
				else $block.remove(); 
			});
			
			// Clean up any stray decorations
			$contentDiv.find('div.code-block-decoration').remove();
			
			$contentDiv.find('pre').each((j, pre) => {
				if (!$in(pre).parent().hasClass('code-wrapper')) processBlock(pre);
			});
			
			const modelRow = `
			<div class="message-row model">
				<div class="message-body">
					${thoughtHtml}
					<div class="markdown-body">
						${$contentDiv.html() || ''}
					</div>
				</div>
			</div>`;
			$container.append(modelRow);
		}
	});
	
	fs.writeFileSync(ARGS.outputFile, $out.html(), 'utf8');
	console.log(`✨ Success! Output: ${ARGS.outputFile}`);
}

finalizeTranscript();

