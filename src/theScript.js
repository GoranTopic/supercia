import { read_cookies } from './utils/cookies.js'
import getText from './utils/getText.js'
import { busqueda_de_companias } from './urls.js'
import waitUntilRequestDone from './utils/waitForNetworkIdle.js'
import recognizeCaptchan from './utils/recognizeNumberCaptchan.js'
import { Checklist, DiskList } from './progress.js';
import { write_json, read_json, mkdir } from './utils/files.js';
import puppeteer from 'puppeteer';
import fs from 'fs';

// set debugging 
let debugging = true

// options of browser
let options = read_json('../options.json');
let browserOptions = options.browser;

// target 
let target_url = busqueda_de_companias;
let names = read_json('../data/mined/company_names.json');
let name = names[247]; // random name

// create new browser
const browser = await puppeteer.launch(browserOptions)

// get page
let page = ( await browser.pages() )[0];

// read cookies
await read_cookies(page);

//console.log('page to load');
await page.goto( target_url,
		{ waitUntil: 'networkidle0' });

/* scraps a id from a single company name */
await waitUntilRequestDone(page, 1000)

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

// remove suggestion
await page.keyboard.press('Enter');

// wait until for a little
await waitUntilRequestDone(page, 2000);

// get captchan 
let [ captchan ] = 
		await page.$x('//img[@id="frmBusquedaCompanias:captchaImage"]');

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
await captchan_input.type(captchan_text, {delay: 100});

// get the search button
debugging && console.log("getting search button..")
// get
let [ search_button ] =
		await page.$x('//button[@id="frmBusquedaCompanias:btnConsultarCompania"]')

// click seach button
debugging && console.log("clicking search_button...")
await search_button.click({delay: 1});

// wait until new page loads
debugging && console.log("waiting for new page to load...")
await waitUntilRequestDone(page, 2000);

/* company page */

/* if there is a credential button */
let get_credential_pdf = async page => {
		// if there is button
		let [ certificado_button ] = await page.$x('//span[text()="Imprimir certificado"]/..')
		// if button was found
		if( certificado_button ){
				// press button
				await certificado_button.click()
				await waitUntilRequestDone(page, 2000);
				// get frame 
				let [ iframe ] = await page.$x('//iframe')
				// get the iframe src
				let coded_src = await page.evaluate( iframe => iframe.src, iframe )
				// decode src
				let src = decodeURIComponent(coded_src.split('file=')[1])
				// download pdf
				console.log('Got pdf:', src)
				let pdfString = await page.evaluate( async url => 
						new Promise(async (resolve, reject) => {
								const reader = new FileReader();
								const response = await window.fetch(url);
								const data = await response.blob();
								reader.readAsBinaryString(data);
								reader.onload = () => resolve(reader.result);
								reader.onerror = () => reject('Error occurred while reading binary string');
						}), src
				);
				//const response = await page.goto(pdf);
				const pdfData = Buffer.from(pdfString, 'binary');
				return fs.writeFileSync( companies_dir + name + '/information_general.pdf', pdfData);
		}else // button was not found
				return  false
}

/* function of scraping general infomation tab */
let scrap_informacion_general = async page => {
		let properties = {}
		let information_general = {};
		// get table 
		let [table_list] = await page.$x('//div[@role="tablist"]')
		// get all labels 
		let labels = await getText( await table_list.$x('.//label') )
		// get all input elements 
		let input_el = await table_list.$x('.//input | .//textarea')
		// get text values from inputs
		let values = await Promise.all( 
				input_el.map( async el => await page.evaluate( el => el.value, el ) )
		)
		// match labels and values
		labels.forEach( (l, i) => properties[l] = values[i].trim() )
		// write_file 
		write_json(properties, companies_dir + name + '/information_general.json')
		return get_credential_pdf(page);
}



let tab_scrapers = {
		'Información general': scrap_informacion_general,
		'Administradores actuales': () => false,
		'Administradores anteriores': ()=>false,
		'Actos jurídicos': ()=>false,
		'Accionistas': ()=>false,
		'Kárdex de accionistas': ()=>false,
		'Información anual presentada': ()=>false,
		'Consulta de cumplimiento': ()=>false,
		'Documentos online': ()=>false, 
		'Valores adeudados': ()=>false,
		'Valores pagados': ()=>false,
		'Notificaciones generales': ()=>false,
}

// directory
let companies_dir = '../data/mined/companies/'
// make directory 
mkdir(companies_dir)
// company directory 
mkdir(companies_dir + name)

// make checklist of values
let checklist_tabs = new Checklist( "tabs_" + name, Object.keys(tab_scrapers))

// get page again
page = ( await browser.pages() )[0];

// get all tabs elemte
let [ tabs_element ] = await page.$x('//div[@id="frmMenu:menuPrincipal"]')
debugging && console.log("got tabs")

// get tabs a tags 
let tabs = await tabs_element.$x('.//span/..')

// for every tab
for( let current_tab of tabs){
		// click on first tab 
		current_tab.click()
		// wait
		await waitUntilRequestDone(page, 500);
		// get name of the current tab
		let current_tab_name = await getText(current_tab);
		// if it has not been checked off
		if( ! checklist_tabs.isCheckedOff( current_tab_name ) ){
				// if function successfull
				if( await tab_scrapers[current_tab_name](page) )  
						checklist_tabs.check(current_tab_name)
		}
}





//console.log('closing browser')
// close browser
//await browser.close();



export { page, getText, }
