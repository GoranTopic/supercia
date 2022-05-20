import make_state from '../makeState.js';
import waitUntilRequestDone from '../../utils/waitForNetworkIdle.js'
import { busqueda_de_companias } from '../../urls.js'
import recognizeCaptchan from '../../utils/recognizeNumberCaptchan.js'
import options from '../../options.js'

// set debugging 
let debugging = options.debugging;

// condition for entering input name state
const input_name_condition = async browser => 
		// if it dow not have a page yet, and the page is at consulta principal
		( ( await browser.pages() ).length === 1 &&
				(( await browser.pages() )[0].url() === busqueda_de_companias ) )

/* scraps a id from a single company name */
const input_name_script = async (browser, name) => {
		console.log('Seaching for company by name...')
		// for page to load
		let [ page ] = await browser.pages();
		await waitUntilRequestDone(page, 2000)
		// get the radion 
		let [ radio_el ] = await page.$x('//*[text()="Nombre"]/..');

		// click on the name radio
		if(radio_el) await radio_el.click();
		else throw new Error('could not radion element')

		// until it loads the name
		debugging && console.log("getting text input")
		await waitUntilRequestDone(page, 1000)

		// get the main text input
		let [ text_input ] = 
				await page.$x('//input[@id="frmBusquedaCompanias:parametroBusqueda_input"]')

		// type name of company
		debugging && console.log("typing name")
		await waitUntilRequestDone(page, 1000)
		await text_input.type(name, {delay: 10});
		await waitUntilRequestDone(page, 1000)

		// select suggestion
		await page.keyboard.press('Enter');

		// wait until for a little
		await waitUntilRequestDone(page, 2000);

		// wait until captchan appears
		let captchan = 
				await page.waitForXPath('//img[@id="frmBusquedaCompanias:captchaImage"]');

		// take screenshot of captchan
		let captchan_buffer = await captchan.screenshot();

		// recognize the captchan
		debugging && console.log("recognizing captchan...")
		let captchan_text = await recognizeCaptchan(captchan_buffer);
		debugging && console.log("got captchan: " + captchan_text)

		// get the captchan input 
		let [ captchan_input ] = 
				await page.$x('//input[@id="frmBusquedaCompanias:captcha"]')  

		// input captchan numbers
		await captchan_input.type(captchan_text, {delay: 130});

		
		// getting the search button
		debugging && console.log("getting search button..")
		let [ search_button ] =
				await page.$x('//button[@id="frmBusquedaCompanias:btnConsultarCompania"]')

		// click seach button
		debugging && console.log("clicking search_button...")
		await search_button.click({delay: 1});

		// wait until new page loads
		debugging && console.log("waiting for new page to load...")
		await waitUntilRequestDone(page, 2000);
}

// make state
export default make_state( 
		input_name_condition,
		input_name_script
)
