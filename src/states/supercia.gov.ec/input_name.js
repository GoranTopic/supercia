import make_state from './state.js';
import {
		home_page_url, 
		base_url_download,
		isAtHomePage, 
		isAtConsultaPrincipal,
		isAtCompanyDocumentsPage
} from '../../urls.js';

// condition for entering input name state
const input_name_condition = async browser => 
		// if it dow not have a page yet, and the page is at consulta principal
		( await browser.pages() ).length === 1 &&
				isAtConsultaPrincipal(( await browser.pages() )[0])

/* scraps a id from a single company name */
const input_name_script = async (browser, name, debug=false) => {
		// for page to load
		let [ page ] = await browser.pages();
		//console.log("getting radio element")
		await waitUntilRequestDone(page, 2000)
		// get the radion 
		let radio_el = 
				await page.waitForXPath('//label[text()="Nombre"]/../input');
		// click on the name radio
		if(radio_el) await radio_el.click();
		else throw new Error('could not radion element')
		// until it loads the name
		debugging && console.log("getting text input")
		await waitUntilRequestDone(page, 1000)
		// get the main text input
		let text_input = ( 
				await page.$x("//span[text()='Parámetro']/../i/input")
		)[0];
		// get button element  
		debugging && console.log("getting search button")
		let search_button = (
				await page.$x("//td[text()='Buscar']/../../..")
		)[0];
		// type name of company
		debugging && console.log("typing name")
		await text_input.type(name, {delay: 10});
		await waitUntilRequestDone(page, 1000)
		// get from options
		await page.keyboard.press('ArrowLeft');
		// remove suggestion
		await page.keyboard.press('Enter');
		// wait until for a little
		await waitUntilRequestDone(page, 1000)
		// click seach button
		debugging && console.log("clicking search_button")
		await search_button.click({delay: 1});
		// wait until new page loads
		debugging && console.log("waiting for new page to load")
		await waitUntilRequestDone(page, 1000);
		// get the url value 
		let url = page.url();
		// get ids 
		let id = extract_id(url);
		if( !id ) throw "Could not get id"
		// save id
		save_id({ company: name, id, url });
		// wait until page loads
		debugging && console.log("clicking on documents online")
		let [ document_button ] =
				await page.$x('//span[text()="Documentos Online"]/../..');
		// click the document
		await document_button.click();
		// wait for a while
		await waitUntilRequestDone(page, 2000)
		// wait until request is rendered
		while( (await browser.pages()).length  <= 1 )
				await page.mainFrame().waitForTimeout(100)
		// close page after being done
		await page.close()
}

// make state
export default make_state( 
		input_name_condition,
		input_name_script
)
