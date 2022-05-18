import Tesseract from 'tesseract.js';

const recognizeNumbers = async file  => 
		await Tesseract.recognize(
				file,
				'eng',
				//{ logger: m => console.log(m) }
		).then( 
				({ data: { text } }) => text 
		).catch(
				e => console.error(e)
		) 

export default recognizeNumbers
