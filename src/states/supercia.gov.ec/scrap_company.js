import make_state from '../makeState.js';
import { information_de_companies } from '../../urls.js'
import getText from '../../utils/getText.js'
import waitUntilRequestDone from '../../utils/waitForNetworkIdle.js'
import { write_json, mkdir, fileExists } from '../..//utils/files.js';
import download_pdf from '../../utils/download_pdf.js';
import { Checklist, DiskList } from '../../progress.js';
import sanitize from '../../utils/sanitizer.js'
import options from '../../options.js'

// set debugging 
let debugging = options.debugging;

/* this function tries to scrap the certificado of general information of a company */
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
		get_credential_pdf(page, path + '/information_general');
		// got  to the end
		return true
}

/* this function, get the tabs of online documents ans scrap all of them */
const scrap_documents = async (page, path) => {
		/* scrap documetns  */
		console.log('scrap documents ran')
		// wait until page is loaded
		await waitUntilRequestDone(page, 1000);
		// get docuemtn tabs 
		let document_tabs = await page.$x('//form[@id="frmInformacionCompanias"]//li')
		//make usre we got dem tabs
		if(!document_tabs) throw Error("Could not extract document_tabs")
		let tab_names  = (await getText(document_tabs)).map(t => t.trim());
		// make checklist for each document tabs
		let checklist_document_tabs = new Checklist("document_tabs_" + name, tab_names);
		// for each document tab
		for(let i = 0; i < document_tabs.length; i++ ){
				// only run if it not marked
				if(!checklist_document_tabs.isCheckedOff(tab_names[i])){
						// get tab
						await waitUntilRequestDone(page, 1000);
						let tab = document_tabs[i];
						// make new path 
						let cur_path = path + `/${tab_names[i]}`;
						mkdir(cur_path)
						// click on tab
						await tab.click();
						// wait for tab to be loaded
						await waitUntilRequestDone(page, 1000);
						// get panels 
						let [ panel_container ] = await page.$x('//div[@class="ui-tabs-panels"]')
						let panels = await panel_container.$x('./div')
						// get same pane as clicked tab
						// wait until pdfs show up
						console.log("got up to here")
						let panel = panels[i]
						if(panel) console.log("got panel")
						// refresh selectors - get selector
						await waitUntilRequestDone(page, 1000);
						let [ selector ] = await panel.$x('.//select')
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
						let rows = await panel.$x( './/tr[@class="ui-widget-content ui-datatable-even"] | .//tr[@class="ui-widget-content ui-datatable-odd"]');
						if(rows) console.log("got rows")
						// for every row in pdf
						for( let row of rows ){
								// get name based on the table values
								let columns = await row.$x('./td')
								let pdf_column = columns.pop();
								//await waitUntilRequestDone(page, 1000);
								let pdf_name = ( await getText(columns) ).map( v => v.trim()).join('_')
								// if file doe not exists already
								let filename = cur_path +'/' + sanitize(pdf_name);
								if(fileExists(filename + ".pdf")){
										console.log(`Already have pdf: ${filename + ".pdf"}`)
								}else{ // scrap file
										// click url 
										await pdf_column.click();
										// wait until pdfs show up
										//await waitUntilRequestDone(page, 100);
										// get url
										let [ iframe ] = await page.$x('//iframe');
										if(iframe) console.log('got iframe');
										// get the iframe src
										let coded_src = await page.evaluate( iframe => iframe.src, iframe )
										// decode src
										let src = decodeURIComponent(coded_src.split('file=')[1])
										console.log('got src:', src)
										// download pdf
										await download_pdf(src, page, filename)
										// wait?
										await waitUntilRequestDone(page, 2000);
										// close window
										try {
												await (
														await page.waitForXPath('//form[@id="frmPresentarDocumentoPdf"]//button')
												).click();
										}catch(e){
												console.error(e)
												console.log('closing windows with console')
												await page.evaluate( () => {
														PrimeFaces.bcn( this,event,[ function(event){PF('dlgPresentarDocumentoPdf').hide() } ] );
												})
										}
										console.log('closed pdf viewer')
										// wait until it is down
										await waitUntilRequestDone(page, 1000);
								}
						}
						// check off the document tab
						checklist_document_tabs.check(tab_names[i])
				}
		}
		return true
}

/* this is a list of scrap function mapped their respective tabs, if one is missing, they don't run */
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


// condition for entering company scrap  state
const condition = async browser => 
		// it must have one page an it must be at the company home page
		( ( await browser.pages() ).length === 1 &&
				(( await browser.pages() )[0].url() === information_de_companies ) )

const scrap_companies_script = async ( browser, name ) => {
		// directory where to stor mined data
		let companies_dir = './data/mined/companies'

		// make directory, just in case if does not exits, 
		// but it really should
		mkdir(companies_dir)
		
		// company directory 
		let path = companies_dir + "/" +name
		mkdir(path)

		//make checklist of values
		let checklist_tabs = new Checklist( "tabs_" + name, Object.keys(tab_scrapers))
		//wait until page loads
		await waitUntilRequestDone(page, 500);

		// get page again
		page = ( await browser.pages() )[0];
		console.log('got new page')

		//wait until page loads
		await waitUntilRequestDone(page, 500);

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
										await waitUntilRequestDone(page, 1000);
										
										// click on first tab 
										await current_tab.click() // and wait
										await waitUntilRequestDone(page, 1000);

										result = // run function
												await tab_scrapers[current_tab_name](
														page, path + `/${current_tab_name}`
												) 

										// if function successfull, check off list
										if(result)
												checklist_tabs.check(current_tab_name)

								}catch(e){
										console.error(e)
								}
						} 
				}
		}
		return true;
}

// make state
export default make_state( 
		condition,
		scrap_companies_script
)
