const init1 = () => {
	if (typeof window.webpLinks === 'undefined') {
		window.webpLinks = new Set();
	}
	const script1 = document.createElement('script');
	script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
	document.head.appendChild(script1);
	
	
    document.querySelectorAll('img').forEach(img => {
        if (img.src.includes('.webp')) window.webpLinks.add(img.src);
    });

    // Scan all elements' computed styles for background images
    document.querySelectorAll('*').forEach(el => {
        const bg = getComputedStyle(el).backgroundImage;
        if (bg && bg.includes('.webp')) {
            const urlMatch = bg.match(/url\(["']?(.*?)["']?\)/);
            if (urlMatch && urlMatch[1].includes('.webp')) {
                window.webpLinks.add(urlMatch[1]);
            }
        }
    });

    console.log(Array.from(window.webpLinks));
};

const observe = () => {
	const observer = new MutationObserver((mutationsList) => {
		mutationsList.forEach(mutation => {
			if (mutation.type === 'childList') {
				mutation.addedNodes.forEach(node => {
					if (node.nodeType === 1) { // ELEMENT_NODE
						// Check for <img> tags
						if (node.tagName === 'IMG' && node.src.includes('.webp')) {
							window.webpLinks.add(node.src);
							console.log('Found .webp image:', node.src, 'total', window.webpLinks.size);
						}

						// Check for background images on the new node
						const bg = getComputedStyle(node).backgroundImage;
						if (bg && bg.includes('.webp')) {
							const urlMatch = bg.match(/url\(["']?(.*?)["']?\)/);
							if (urlMatch && urlMatch[1].includes('.webp')) {
								window.webpLinks.add(urlMatch[1]);
								console.log('Found .webp background:', urlMatch[1], 'total', window.webpLinks.size);
							}
						}
					}
				});
			} else if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
				const bg = getComputedStyle(mutation.target).backgroundImage;
				if (bg && bg.includes('.webp')) {
					const urlMatch = bg.match(/url\(["']?(.*?)["']?\)/);
					if (urlMatch && urlMatch[1].includes('.webp')) {
						window.webpLinks.add(urlMatch[1]);
						console.log('Found .webp background (style change):', urlMatch[1], 'total', window.webpLinks.size);
					}
				}
			}
		});
	});

	observer.observe(document.body, {
		childList: true,
		attributes: true,
		subtree: true,
		attributeFilter: ['style']
	});

	console.log('✅ WebP MutationObserver active. Collected links stored in window.webpLinks.');
};

const savePdf = async () => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    const urls = Array.from(window.webpLinks); // Your webp list
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        console.log(`Processing ${i + 1} / ${urls.length}`);

        const img = await fetch(url)
            .then(res => res.blob())
            .then(blob => createImageBitmap(blob));

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Scale image to fit page
        const ratio = Math.min(pageWidth / img.width, pageHeight / img.height);
        const imgWidth = img.width * ratio;
        const imgHeight = img.height * ratio;
        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imgData = canvas.toDataURL('image/webp');
        pdf.addImage(imgData, 'WEBP', x, y, imgWidth, imgHeight);

        if (i < urls.length - 1) pdf.addPage();
    }

    pdf.save('flipbook.pdf');
};

const autoFlip = () => {
	const autoFlipHandle = setInterval(() => {
		const btn = document.querySelector('.flip_button_right');
		
		if (btn && btn.offsetParent !== null) {
			btn.click();
			console.log('Clicked next page');
		} else {
			console.log('Button not visible, stopping...');
			clearInterval(autoFlipHandle);
			savePdf();
		}
	}, 2000);  // Wait 2 seconds between each attempt
}

init1();
observe();
autoFlip();
