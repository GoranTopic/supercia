import Tesseract from 'tesseract.js';

const recognizeNumbers = async file  => {
		const result = null
		await Tesseract.recognize(
				file,
				'eng',
				//{ logger: m => console.log(m) }
		).then( 
				({ data: { text } }) => result = text 
		).catch(
				e => console.error(e)
		) 
		return result;
}

export default recognizeNumbers
