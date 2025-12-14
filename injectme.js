document.addEventListener('DOMContentLoaded', () => {
	
	document.querySelectorAll('.user-bubble').forEach(bubble => {
		bubble.addEventListener('click', (e) => {
			const isButton = e.target.closest('button');
			const isExpanded = bubble.classList.contains('expanded');
			
			if (!isExpanded) {
				toggleUserBubble(bubble);
			} else if (isExpanded && isButton && isButton.classList.contains('toggle-btn')) {
				toggleUserBubble(bubble);
			}
		});
	});
	
	function toggleUserBubble(bubble) {
		const btn = bubble.querySelector('.toggle-btn');
		const icon = btn.querySelector('.material-icons');
		
		if (bubble.classList.contains('expanded')) {
			bubble.classList.remove('expanded');
			bubble.classList.add('collapsed');
			icon.textContent = 'unfold_more';
			btn.title = "Expand";
		} else {
			bubble.classList.remove('collapsed');
			bubble.classList.add('expanded');
			icon.textContent = 'unfold_less';
			btn.title = "Collapse";
		}
	}
	
	document.querySelectorAll('.thought-header').forEach(header => {
		header.addEventListener('click', () => {
			const block = header.closest('.thought-block');
			block.classList.toggle('collapsed');
		});
	});
	
	// Copy Button Handler (Shared for both Code and User Bubble)
	const handleCopy = async (btn, textSource) => {
		const text = textSource();
		if (!text) return;
		try {
			await navigator.clipboard.writeText(text);
			spawnSparkles(btn);
		} catch (err) { console.error("Copy failed", err); }
	};
	
	document.querySelectorAll('.copy-btn').forEach(btn => {
		btn.addEventListener('click', () => {
			const wrapper = btn.closest('.code-wrapper');
			handleCopy(btn, () => wrapper.querySelector('pre code')?.innerText);
		});
	});
	
	document.querySelectorAll('.user-copy-btn').forEach(btn => {
		btn.addEventListener('click', () => {
			const bubble = btn.closest('.user-bubble');
			handleCopy(btn, () => bubble.querySelector('.bubble-content')?.innerText);
		});
	});
	
	function spawnSparkles(element) {
		const rect = element.getBoundingClientRect();
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		const sparkleUrl = window.ASSETS.sparkleIcon;
		
		for (let i = 0; i < 6; i++) {
			const el = document.createElement('div');
			el.className = 'sparkle';
			el.style.backgroundImage = `url('${sparkleUrl}')`;
			el.style.left = cx + 'px';
			el.style.top = cy + 'px';
			
			const angle = Math.random() * Math.PI * 2;
			const dist = 30 + Math.random() * 50;
			const tx = Math.cos(angle) * dist + 'px';
			const ty = Math.sin(angle) * dist + 'px';
			
			el.style.setProperty('--tx', tx);
			el.style.setProperty('--ty', ty);
			
			document.body.appendChild(el);
			setTimeout(() => el.remove(), 600);
		}
	}
});

