import { read_cookies } from './utils/cookies.js'
import getText from './utils/getText.js'
import { busqueda_de_companias } from './urls.js'
import waitUntilRequestDone from './utils/waitForNetworkIdle.js'
import recognizeCaptchan from './utils/recognizeNumberCaptchan.js'
import { Checklist, DiskList } from './progress.js';
import { write_json, read_json, mkdir } from './utils/files.js';
import download_pdf from './utils/download_pdf.js';
import puppeteer from 'puppeteer';

// set debugging 
let debugging = true

// options of browser
let options = read_json('../options.json');
let browserOptions = options.browser;

// target 
let target_url = busqueda_de_companias;
let names = read_json('../data/mined/company_names.json');
//let name = names[247]; // random name
let name = 'fybeca'; // random name

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
let get_credential_pdf = async (page, path) => {
		try{
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
				await waitUntilRequestDone(page, 2000);
				let result = await download_pdf(src, page, path) 
				if(result) console.log('Got pdf:', src)
				// close window
				await (await page.$x('//form[@id="frmPresentarDocumentoPdf"]//button'))[0]
						.click()
				// wait until it is down
				await waitUntilRequestDone(page, 100);
				return result;
		}
		}catch(e){
				console.log('could not get certificado');
				console.error(e);
		}
}

/* function of scraping general infomation tab */
let scrap_informacion_general = async (page, path) => {
		// add tab name
		path += '/information_general'
		// make dir if it does not exits
		mkdir(path)
		// information container
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
		labels.forEach( (l, i) => information_general[l] = values[i].trim() )
		// write_file 
		write_json(information_general, path + '/information_general.json')
		// get pdf credentials
		return get_credential_pdf(page, path + '/information_general');
}

let i,tab, selectors, selector, panel_container, panel, panels, cur_path, columns, pdf_column, pdf_name, iframe, coded_src, result, src, rows, tab_name, tab_names, documents_tab_checklist, pdf_names, checklist_row_pdf, checklist_document_tabs;
const scrap_documents = async (page, path) => {
		/* scrap documetns  */
		console.log('scrap documents ran')
		// wait until page is loaded
		await waitUntilRequestDone(page, 1000);
		// get docuemtn tabs 
		let document_tabs = await page.$x('//form[@id="frmInformacionCompanias"]//li')
		tab_names  = (await getText(document_tabs)).map(t => t.trim());
		// make checklist for each document tabs
		checklist_document_tabs = new Checklist("document_tabs_" + name, tab_names);
		// for each document tab
		for( i = 0; i < document_tabs.length; i++ ){
				// only run if it not marked
				if(!checklist_document_tabs.isCheckedOff(tab_names[i])){
						// get tab
						await waitUntilRequestDone(page, 1000);
						tab = document_tabs[i];
						// make new path 
						cur_path = path + `/${tab_names[i]}`;
						mkdir(cur_path)
						// click on tab
						await tab.click();
						// wait for tab to be loaded
						await waitUntilRequestDone(page, 1000);
						// get panels 
						[ panel_container ] = await page.$x('//div[@class="ui-tabs-panels"]')
						panels = await panel_container.$x('./div')
						// get same pane as clicked tab
						// wait until pdfs show up
						console.log("got up to here")
						panel = panels[i]
						if(panel) console.log("got panel")
						// refresh selectors - get selector
						await waitUntilRequestDone(page, 1000);
						[ selector ] = await panel.$x('.//select')
						if(selector) console.log("got selector")
						// click selector
						await selector.click()
						console.log("selector clicked")
						// wait  for tab to be loaded
						await waitUntilRequestDone(page, 1000);
						// select all documents
						for(let j =0; j < 8; j++) await page.keyboard.press('ArrowDown')
						// Enter
						await page.keyboard.press('Enter')
						// wait until pdfs show up
						await waitUntilRequestDone(page, 1000);
						// get all pdf even rows
						rows = await panel.$x( './/tr[@class="ui-widget-content ui-datatable-even"] | .//tr[@class="ui-widget-content ui-datatable-odd"]');
						if(rows) console.log("got rows")
						// get all pdf name from all rows, uniting all columns
						pdf_names = await Promise.all( // cover your eyes, this ain't preatty
								rows.map(async row=>(await getText(await row.$x('./td'))).map(v=>v.trim()).join('_'))
						)
						// make chekist of each pdf
						checklist_row_pdf = new Checklist(`${tab_names[i]}_${name}`, pdf_names)
						// for every row in pdf
						for( let row of rows ){
								// get name based on the table values
								columns = await row.$x('./td')
								pdf_column = columns.pop();
								//await waitUntilRequestDone(page, 1000);
								pdf_name = ( await getText(columns) ).map( v => v.trim()).join('_')
								// if pdf_row is not checked off the list
								if(!checklist_row_pdf.isCheckedOff(pdf_name)){
										// click url 
										await pdf_column.click();
										// wait until pdfs show up
										//await waitUntilRequestDone(page, 100);
										// get url
										[ iframe ] = await page.$x('//iframe');
										if(iframe) console.log('got iframe');
										// get the iframe src
										coded_src = await page.evaluate( iframe => iframe.src, iframe )
										// decode src
										src = decodeURIComponent(coded_src.split('file=')[1])
										console.log('got src:', src)
										// download pdf
										await download_pdf(src, page, cur_path +'/' + pdf_name) 
										// wait?
										await waitUntilRequestDone(page, 2000);
										// close window
										await (await page.$x('//form[@id="frmPresentarDocumentoPdf"]//button'))[0].click()
										console.log('closed pdf viewer')
										// wait until it is down
										await waitUntilRequestDone(page, 1000);
										// check off the document
										checklist_row_pdf.check(pdf_name)
								}
						}
						// check off the document tab
						checklist_document_tabs.check(tab_names[i])
				}
		}
		return false
}

let tab_scrapers = {
		'Información general': scrap_informacion_general,
		'Administradores actuales': null,
		'Administradores anteriores': null,
		'Actos jurídicos': null,
		'Accionistas': null,
		'Kárdex de accionistas': null,
		'Información anual presentada': null,
		'Consulta de cumplimiento': null,
		'Documentos online': scrap_documents, 
		'Valores adeudados': null,
		'Valores pagados': null,
		'Notificaciones generales': null,
}

// directory
let companies_dir = '../data/mined/companies/'
// make directory 
mkdir(companies_dir)
// company directory 
let path = companies_dir + name
mkdir(path)

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
for( let current_tab of tabs ){
		// get name of the current tab
		let current_tab_name = await getText(current_tab);
		// if it has not been checked off
		if( ! checklist_tabs.isCheckedOff( current_tab_name ) ){
				// if we hae function for it 
				if( tab_scrapers[current_tab_name] ){
						try{
								// click on first tab 
								await current_tab.click() // and wait
								await waitUntilRequestDone(page, 500);
								// run function
								await tab_scrapers[current_tab_name](page, path + `/${current_tab_name}`) 
								// if function successfull, check off list
								checklist_tabs.check(current_tab_name)
						}catch(e){
								console.error(e)
						}
				} 
		}
}

//console.log('closing browser')
// close browser
//await browser.close();

export { page, getText, panel, panel_container, panels, i, selector}
