import make_state from './state.js';
import {
		home_page_url, 
		base_url_download,
		isAtHomePage, 
		isAtConsultaPrincipal,
		isAtCompanyDocumentsPage
} from '../../urls.js';


/* scrap the documents */
const company_documents_script = async (browser, debuging=false) => {
		// get page
		let [ page ] = await browser.pages();
		// wait until request is rendered
		await waitUntilRequestDone(page, 100)
		// all get economic documents
		await scrap_economic_documents(browser, debuging);
		// wait
		//await page.mainFrame().waitForTimeout(30000)
		//return { res: true }
}

//hande the economic tab
const scrap_economic_documents = async (browser) => {
		let [ page ] = await browser.pages();
		if(debugging && page) 
				console.log('got page in scrap_economic_documents')
		// get page
		let doc = {}; 
		// wai until page is done
		debugging && console.log('waiting for traffic to settle')
		await waitUntilRequestDone(page, 1500)
		// get economic tabs 
		// get table 
		debugging && console.log('getting tableBox..');
		let [ table_general, table_juridic, table_economic ] = 
				await page.$x('(//div[@class="z-listbox-body"]/table/tbody)[1]/tr');
		// get all items
		let items = 
				await page.$x('(//div[@class="z-listbox-body"])[1]/table/tbody[2]/tr');
		console.log( await getText(items));
		//...( await tableBox.$x('/tr[@class="z-listitem"]') ),
		//...( await tableBox.$x('/tr[@class="z-listitem z-listbox-odd"]') ) 
		//]
		debugging && console.log(`got ${items.length} documents`);
		if(items.length > 0){ 
				// if there is at least one element
				let elements = await items[1].$x('./td[@class="z-listcell"]');
				doc['expedient'] = await getText(elements[0])
				doc['description'] = await getText(elements[1])
				doc['date'] = await getText(elements[2])
				doc['button'] = elements[3]
				// click on document download
				debugging && console.log('got document')
				await waitUntilRequestDone(page, 1000)
				debugging && console.log('clicking on document donwload page')
				await doc['button'].click()
				// wait until new page is open
				await waitUntilRequestDone(page, 2000)
				// new page did not open
				if( (await browser.pages()).length === 1 ) 
						throw new Error('Did not open new page');
				//console.log(await browser.pages())
				// switch tabs 
				page = ( await browser.pages() )[1];
				await handle_id_input(page);
		}
}

// handle the ecuadorian id input
const handle_id_input = async page => {
		if(page){
				console.log("got page in handle_id_input");
		}else{
				console.log("did not get page on handle_id_input");
				console.log(page);
		}
		await waitUntilRequestDone(page, 2000)
		// handeling the inputting of id
		let [ ecuadorian_radio ] =
				await page.$x('//input[@type="radio"]');
		if(ecuadorian_radio){ 
				console.log("got ecuadorian radio")
				ecuadorian_radio.click()
		}
		await page.mainFrame().waitForTimeout(1000)
		// type the id
		let id_input = ( await page.$x('//input[@type="text"]') )[0];
		await id_input.type("", {delay: 10} )
		// press search 
		await page.mainFrame().waitForTimeout(1000)
		let submit_button = ( await page.$x('//span[@class="z-button"]') )[0];
		await submit_button.click();
		// download document
		await page.mainFrame().waitForTimeout(1000)
		await download_document(page);
}

//	 downlaod ad document from a page
const download_document = async ( page ) => {
		let [ iframe ] = await page.$x('//iframe');
		let pdf_url = await page.evaluate( iframe => iframe.src, iframe)
		//await page._client.send('Page.setDownloadBehavior', 
		//		{behavior: 'allow', downloadPath: '/home/telix/puppeteer_playground'}
		//);
		console.log('got filename:', pdf_url)
		let pdfString = await page.evaluate( async url => 
				new Promise(async (resolve, reject) => {
						const reader = new FileReader();
						const response = await window.fetch(url);
						const data = await response.blob();
						reader.readAsBinaryString(data);
						reader.onload = () => resolve(reader.result);
						reader.onerror = () => reject('Error occurred while reading binary string');
				}), pdf_url
		);
		//const response = await page.goto(pdf);
		const pdfData = Buffer.from(pdfString, 'binary');
		fs.writeFileSync('somepdf.pdf', pdfData);
}

// condition
const company_documents_condition = async browser => 
		// if it dow not have a page yet,
		// and the page is at compnay documents page
		( await browser.pages() ).length === 1 &&
				isAtCompanyDocumentsPage(( await browser.pages() )[0])

// state 
export default make_state( 
		company_documents_condition,
		company_documents_script
)
