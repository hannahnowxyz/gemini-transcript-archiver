#!/usr/bin/env python3

import re
from bs4 import BeautifulSoup
import sys
import os

def simplify_html(input_path, output_path):
	"""
	Simplifies a Gemini/Angular HTML transcript.
	
	V22 Fixes:
	1. Fixes PDF Overflow: Re-constrains widths in print mode to override the global 'max-width: none' rule.
	2. Adds 'word-break: break-all' to code blocks in print to force wrapping of continuous strings.
	"""
	
	print(f"Processing: {input_path}")
	
	try:
		with open(input_path, 'r', encoding='utf-8') as f:
			soup = BeautifulSoup(f, 'html.parser')
	except FileNotFoundError:
		print(f"Error: Could not find {input_path}")
		return

	# --- Step 1: Extract Conversation Items ---
	conversation_items = soup.find_all(['user-query', 'model-response'])
	
	if not conversation_items:
		print("Error: No <user-query> or <model-response> tags found.")
		return

	print(f"Found {len(conversation_items)} conversation items.")

	# --- Step 2: Targeted Cleanup & Button Logic ---
	for item in conversation_items:
		# 1. Remove garbage
		garbage_selectors = [
			'message-actions',
			'.response-footer', 
			'.response-container-footer', 
			'freemium-rag-disclaimer', 
			'sensitive-memories-banner',
			'.restart-chat-button-scroll-placeholder'
		]
		for selector in garbage_selectors:
			for garbage in item.select(selector):
				garbage.decompose()

		# 2. Process Buttons
		all_icons = item.find_all('mat-icon')
		
		for icon in all_icons:
			parent_btn = icon.find_parent('button')
			if not parent_btn:
				parent_btn = icon.find_parent(class_='mat-mdc-button-base')
			
			if not parent_btn:
				continue

			icon_name = icon.get('data-mat-icon-name') or icon.get_text().strip()
			should_keep = False
			
			# Case A: Expand/Collapse
			if icon_name in ['expand_more', 'expand_less', 'keyboard_arrow_down', 'keyboard_arrow_up', 'chevron_right', 'chevron_left']:
				should_keep = True
				parent_btn['class'] = parent_btn.get('class', []) + ['js-expand-btn']
				parent_btn['data-is-expander'] = "true"
				
				# Context Check
				thoughts_block = parent_btn.find_parent(['model-thoughts', 'thought-process']) or \
								 parent_btn.find_parent(class_=re.compile(r'thought|reasoning'))
				
				if thoughts_block:
					parent_btn['class'] = parent_btn.get('class', []) + ['js-thinking-btn']
					header_parent = parent_btn.parent
					if header_parent:
						header_parent['class'] = header_parent.get('class', []) + ['js-thinking-header']
				else:
					# User/Message Buttons
					if item.name == 'user-query':
						bubble = item.select_one('.user-query-bubble-with-background') or \
								 item.select_one('span[class*="bubble"]') or \
								 item.select_one('.query-content')
						
						if bubble:
							parent_btn.extract()
							bubble.insert(0, parent_btn)
							bubble['class'] = bubble.get('class', []) + ['js-relative-anchor']
						else:
							if parent_btn.parent != item:
								parent_btn.extract()
								item.insert(0, parent_btn)
					
					elif item.name == 'model-response':
						 if parent_btn.parent != item:
								parent_btn.extract()
								item.insert(0, parent_btn)

			# Case B: Code Copy
			elif icon_name == 'content_copy':
				if parent_btn.find_parent(['pre', 'code-block', 'div'], class_=re.compile(r'code|syntax')):
					should_keep = True
					parent_btn['class'] = parent_btn.get('class', []) + ['js-copy-code-btn']

			if not should_keep:
				parent_btn.decompose()
			else:
				for noise in parent_btn.find_all(['span'], class_=re.compile(r'ripple|focus|indicator')):
					noise.decompose()

	# --- Step 3: Prepare New DOM ---
	new_soup = BeautifulSoup("<!DOCTYPE html><html lang='en'></html>", 'html.parser')
	
	if soup.head:
		new_soup.html.append(soup.head)
	else:
		new_soup.html.append(new_soup.new_tag('head'))

	# --- Step 4: Clean Head ---
	for script in new_soup.head.find_all('script'):
		script.decompose()

	# --- Step 5: CSS Overrides ---
	style_override = new_soup.new_tag('style')
	style_override.string = """
		/* 1. SCROLLING */
		html {
			height: auto !important;
			min-height: 100% !important;
			overflow-y: scroll !important;
			overflow-x: hidden !important;
			background-color: inherit;
		}
		body {
			height: auto !important;
			min-height: 100vh !important;
			overflow: visible !important;
			position: relative !important;
			width: 100% !important;
			margin: 0 !important;
			padding: 0 !important;
		}
		::-webkit-scrollbar { width: 12px; height: 12px; }
		::-webkit-scrollbar-track { background: transparent; }
		::-webkit-scrollbar-thumb { background-color: rgba(128, 128, 128, 0.5); border-radius: 6px; border: 3px solid transparent; background-clip: content-box; }

		/* 2. LAYOUT */
		#simplified-conversation {
			max-width: 900px; 
			margin: 0 auto;
			padding: 40px 20px;
			display: flex;
			flex-direction: column;
			gap: 24px;
			color: inherit; 
			overflow: visible !important;
			height: auto !important;
		}
		
		user-query, model-response {
			display: block !important;
			margin-bottom: 20px;
			height: auto !important; 
			overflow: visible !important;
			flex-shrink: 0;
			position: relative;
		}
		
		/* FIX: CONTAINER PADDING */
		user-query {
			width: 85% !important;
			min-width: 85% !important; 
			margin-left: auto !important; 
			margin-right: 0 !important;
			padding-right: 48px !important; 
			box-sizing: border-box !important;
		}

		model-thoughts, .model-thoughts, .thought-process {
			display: block !important;
			margin-bottom: 16px;
		}

		user-query * {
			 max-width: none !important;
			 box-sizing: border-box !important;
		}
		
		.response-container, .content-container, .scrollable-content, model-response > div {
			height: auto !important;
			max-height: none !important;
			overflow-y: visible !important;
			flex: none !important;
		}

		/* 3. BUTTONS */
		button {
			cursor: pointer !important;
			border: none !important;
			background: transparent !important;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			padding: 8px;
			border-radius: 50%;
			transition: background-color 0.2s;
		}
		button:hover {
			background-color: rgba(128, 128, 128, 0.1) !important;
		}

		/* FIX 1: BUTTON & BUBBLE LOGIC */
		.js-relative-anchor {
			position: relative !important;
			overflow: visible !important;
			display: block !important;
			width: 100% !important; 
		}

		.js-expand-btn {
			position: absolute !important;
			top: 0px !important; 
			right: -40px !important; 
			z-index: 10;
		}
		
		/* Thinking Header */
		.js-thinking-header {
			display: flex !important;
			flex-direction: row !important;
			justify-content: flex-start !important; 
			align-items: center !important;
			width: 100% !important;
			position: relative !important;
		}
		
		/* FIX 2: GHOST HOVER FIX */
		.js-thinking-btn {
			position: static !important;
			float: none !important;
			order: -1 !important; 
			margin-left: 0 !important;
			margin-right: 8px !important; 
			margin-top: 0 !important;
			flex-grow: 0 !important;
			flex-shrink: 0 !important;
			width: fit-content !important;
			max-width: max-content !important;
			display: inline-flex !important;
		}
		
		.js-thinking-btn .mat-mdc-button-touch-target {
			display: none !important;
			width: 0 !important;
			height: 0 !important;
		}
		
		/* 4. PREVIEWS */
		.collapsed-preview {
			display: none;
			opacity: 1 !important;
			color: inherit;
			font-family: "Google Sans", "Google Sans Flex", Roboto, Helvetica, Arial, sans-serif !important;
			font-size: 1rem; 
			line-height: 1.5;
			font-style: normal !important;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis; 
			width: 100%;
			min-height: 24px;
			margin-top: 0px !important; 
		}
		
		.collapsed-preview:empty {
			display: none !important;
		}

		/* 5. ICONS */
		.js-expand-btn mat-icon { transition: none !important; }
		.btn-collapsed mat-icon { transform: rotate(0deg) !important; }
		.btn-expanded mat-icon { transform: rotate(180deg); }
		
		pre, code, .code-block { overflow-x: auto !important; }
		img { max-width: 100%; height: auto; }
		
		/* 6. SPARKLE ANIMATION */
		.sparkle {
			position: fixed;
			pointer-events: none;
			font-size: 20px;
			z-index: 9999;
			animation: sparkle-shoot 1s forwards ease-out;
		}
		
		@keyframes sparkle-shoot {
			0% {
				transform: translate(0, 0) scale(0.5);
				opacity: 1;
			}
			100% {
				transform: translate(var(--tx), var(--ty)) scale(1.2);
				opacity: 0;
			}
		}
		
		/* 7. PRINT / PDF FIXES */
		@media print {
			body {
				-webkit-print-color-adjust: exact !important;
				print-color-adjust: exact !important;
			}
			.js-copy-code-btn { display: none !important; }
			
			/* FIX 3: RE-CONSTRAIN WIDTHS & FORCE WRAP */
			/* Must override global 'max-width: none' to trigger overflow-wrap */
			user-query, user-query * {
				max-width: 100% !important;
			}

			pre, code, .code-block, .code-block * {
				white-space: pre-wrap !important;
				overflow-wrap: anywhere !important; /* Standard */
				word-break: break-all !important;   /* Aggressive fallback */
				overflow: visible !important;
				max-width: 100% !important;
			}
			
			mat-icon, img, svg {
				background-color: transparent !important;
				box-shadow: none !important;
				text-shadow: none !important;
				filter: none !important;
				fill: currentColor !important;
			}
		}
	"""
	new_soup.head.append(style_override)

	# --- Step 6: Create Body ---
	new_body = new_soup.new_tag('body')
	if soup.body and soup.body.attrs:
		new_body.attrs = soup.body.attrs

	# --- Step 7: Inject JS ---
	script_tag = new_soup.new_tag('script')
	script_tag.string = """
	document.addEventListener('DOMContentLoaded', () => {
		
		// --- EXPAND/COLLAPSE ---
		const expandButtons = document.querySelectorAll('.js-expand-btn');
		
		expandButtons.forEach(btn => {
			let targetContainer = null;
			const parentBlock = btn.closest('user-query') || btn.closest('model-response');
			const thoughtsBlock = btn.closest('model-thoughts') || btn.closest('.model-thoughts');
			let isThinkingBtn = false;
			
			if (btn.classList.contains('js-thinking-btn') && thoughtsBlock) {
				 isThinkingBtn = true;
				 targetContainer = thoughtsBlock.querySelector('.thoughts-content') || thoughtsBlock.querySelector('.content');
			}
			
			if (!targetContainer && parentBlock) {
				 targetContainer = parentBlock.querySelector('.query-text, .message-content, .model-response-text, .markdown-content');
			}

			if (!targetContainer) {
				const header = btn.closest('.header') || btn.closest('header') || btn.parentElement;
				if (header && (header.innerText.toLowerCase().includes('thinking') || header.innerText.toLowerCase().includes('process'))) {
					isThinkingBtn = true;
					btn.classList.add('js-thinking-btn');
					header.classList.add('js-thinking-header'); 
				}
				if (header) {
					let sibling = header.nextElementSibling;
					while (sibling) {
						if (sibling.tagName === 'DIV' || sibling.tagName === 'MAT-EXPANSION-PANEL-BODY') {
							targetContainer = sibling;
							break;
						}
						sibling = sibling.nextElementSibling;
					}
				}
			}

			if (!targetContainer) return;

			btn.classList.add('btn-expanded');
			let previewDiv = null;
			
			if (!isThinkingBtn) {
				const rawText = targetContainer.textContent || "";
				const cleanText = rawText.replace(/\s+/g, ' ').trim(); 
				previewDiv = document.createElement('div');
				previewDiv.className = 'collapsed-preview';
				previewDiv.textContent = cleanText; 
				targetContainer.parentNode.insertBefore(previewDiv, targetContainer);
			}

			btn.addEventListener('click', (e) => {
				e.stopPropagation();
				const isExpanded = btn.classList.contains('btn-expanded');
				
				if (isExpanded) {
					btn.classList.remove('btn-expanded');
					btn.classList.add('btn-collapsed');
					targetContainer.style.display = 'none';
					if (previewDiv) previewDiv.style.display = 'block';
				} else {
					btn.classList.remove('btn-collapsed');
					btn.classList.add('btn-expanded');
					targetContainer.style.display = ''; 
					if (previewDiv) previewDiv.style.display = 'none';
				}
			});
		});

		// --- CODE COPY & SPARKLES ---
		const copyButtons = document.querySelectorAll('.js-copy-code-btn');
		const emojis = ['✨', '⭐', '🌟', '💫', '🎆'];

		copyButtons.forEach(btn => {
			btn.addEventListener('click', async (e) => {
				const codeBlock = btn.closest('.code-block') || btn.closest('pre');
				if (!codeBlock) return;
				const codeElement = codeBlock.querySelector('code, pre');
				if (!codeElement) return;
				
				try {
					await navigator.clipboard.writeText(codeElement.innerText);
					
					// Icon Swap
					const icon = btn.querySelector('mat-icon');
					const originalIcon = icon.innerText || icon.getAttribute('data-mat-icon-name');
					icon.innerText = 'check';
					icon.setAttribute('data-mat-icon-name', 'check');
					setTimeout(() => {
						icon.innerText = originalIcon;
						icon.setAttribute('data-mat-icon-name', originalIcon);
					}, 2000);

					// SPARKLE LOGIC
					const rect = btn.getBoundingClientRect();
					const centerX = rect.left + rect.width / 2;
					const centerY = rect.top + rect.height / 2;

					for (let i = 0; i < 5; i++) {
						const el = document.createElement('div');
						el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
						el.className = 'sparkle';
						el.style.left = centerX + 'px';
						el.style.top = centerY + 'px';
						
						// Random angle and distance
						const angle = Math.random() * 2 * Math.PI;
						const distance = 60 + Math.random() * 60;
						const tx = Math.cos(angle) * distance + 'px';
						const ty = Math.sin(angle) * distance + 'px';
						
						el.style.setProperty('--tx', tx);
						el.style.setProperty('--ty', ty);
						
						document.body.appendChild(el);
						setTimeout(() => el.remove(), 1000);
					}

				} catch (err) { console.error(err); }
			});
		});
	});
	"""
	new_body.append(script_tag)

	wrapper = new_soup.new_tag('div', id='simplified-conversation')
	for item in conversation_items:
		wrapper.append(item)

	new_body.append(wrapper)
	new_soup.html.append(new_body)

	with open(output_path, 'w', encoding='utf-8') as f:
		f.write(str(new_soup))
	
	print(f"Successfully created simplified file: {output_path}")

if __name__ == "__main__":
	simplify_html("transcript2.html", "transcript_simplified.html")

