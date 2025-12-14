// TODO: Archive user attachments and immersive deliverables
if (document.querySelectorAll([
	'immersive-entry-chip',
	'user-query-file-carousel',
].join(', ')).length > 0) {
	alert('Warning: Attachments and files will not be archived!');
}

// Remove garbage
document.querySelectorAll([
	'div.top-bar-actions',
	'div.temporary-chat-header',
	'#gb',
	'bard-sidenav',
	'div.text-input-field',
	'div.desktop-ogb-buffer',
	'div.side-nav-menu-button',
	'hallucination-disclaimer',
	'input-container.input-gradient',
	'message-actions',
	'.response-footer',
	'.response-container-footer',
	'freemium-rag-disclaimer',
	'sensitive-memories-banner',
	'.restart-chat-button-scroll-placeholder',
	'div.table-footer',
	'iframe',
	'script',
	'noscript',
	'body > div',
	'crust-task',
	'chat-app-tooltips',
	'side-navigation-v2 chat-notifications',
	'chat-app-tooltips',
	'top-bar-actions',
	'chat-app-banners',
	'div.announcement-banner-container',
	'bot-banner',
	'router-outlet',
	'h1.cdk-visually-hidden',
	'div.hidden-content-image-cache',
	'head meta',
	'head link',
].join(', ')).forEach(
	element => {
		try {
			element.remove();
		} catch (error) {
			//console.log(error);
		}
	}
);

// Expand all content
document.querySelectorAll([
	'button[aria-label="Expand"]',
	'button.thoughts-header-button:has(mat-icon[fonticon="expand_more"])',
	'div.response-container-header button.toggle-code:has(mat-icon[fonticon="code"])',
].join(', ')).forEach(
	element => {
		element.click();
	}
);

// Remove "Hide code" buttons
document.querySelectorAll([
	'div.response-container-header:has(button.toggle-code)',
].join(', ')).forEach(
	element => {
		try {
			element.remove();
		} catch (error) {
			//console.log(error);
		}
	}
);

