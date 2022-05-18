import make_state from './state.js';
import { home_page_url, base_url_download } from '../urls.js';

// make home page condition
const home_page_condition = async browser => 
		// if it dow not have a page yet, and it is at null url
		( await browser.pages() ).length === 1 &&
				(( await browser.pages() )[0].url)

// script to handle the home page
const home_page_click_script = async browser => {
		//get page 
		let page = ( await browser.pages() )[0];
		// go to initial login page 
		await page.goto( home_page_url, // wait until the page is fully loaded
				{ waitUntil: 'networkidle0', }
		);
		// get frame 
		const iframeElement = await page.waitForSelector('iframe');
		// get inside the frame
		const frame = await iframeElement.contentFrame();
		// check if there is a popup
		// selecte button
		const button = 
				await frame.waitForXPath('//span[text()="CONSULTA DE COMPAÑÍAS"]');
		// click on button to go to company consulatas
		await button.click();
		// select button
		// wait until request is rendered
		await waitUntilRequestDone(page, 1000)
		// wait for a while
		if( (await browser.pages()).length  <= 1 )
				throw new Error('new page did not open')
		// close page after being done
		await page.close()
}

// make home handle state
export default make_state( 
		home_page_condition,
		home_page_click_script
)
