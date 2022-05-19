const download_pdf = async (url, page, path) => {
		let pdfString = await page.evaluate( async url => 
				new Promise(async (resolve, reject) => {
						const reader = new FileReader();
						const response = await window.fetch(url);
						const data = await response.blob();
						reader.readAsBinaryString(data);
						reader.onload = () => resolve(reader.result);
						reader.onerror = () => reject('Error occurred while reading binary string');
				}), url
		);
		// save pdf binary string 
		const pdfData = Buffer.from(pdfString, 'binary');
		return fs.writeFileSync( path + ".pdf" , pdfData);
}

export default download_pdf
