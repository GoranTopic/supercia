import Tesseract from 'tesseract.js';

Tesseract.recognize(
		'/home/telix/Downloads/88411271629504537905477427062903.png',
		'eng',
		//{ logger: m => console.log(m) }
).then( ({ data: { text } }) => {
		console.log(text);
})
