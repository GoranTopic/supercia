import { ProxyRotator } from '../proxies.js'
import PromiseEngine from '../PromiseEngine.js';
import { read_json } from '../utils/files.js';
import { Checklist, DiskList } from '../progress.js';
import goto_company_search_page from '../states/supercia.gov.ec/goto_company_search_page.js'
import input_company_name from '../states/supercia.gov.ec/input_company_name.js'
import close_browser from '../states/supercia.gov.ec/close_browser.js'
import puppeteer from 'puppeteer';

// options of browser
let options = read_json('./options.json');
let browserOptions = options.browser;

async function main(){
		let engine = new PromiseEngine(1);
		let proxy_r = new ProxyRotator();
		let names = read_json('./data/mined/company_names.json');
		let checklist = new Checklist('companies', names);
		let errored = new DiskList('errored_companies');
		let retries_max = 1;

		// set timeout 1000ms * 60s * 2m
		engine.setTimeout(1000 * 60 * 2 );

		// create timeout process
		const create_promise =  async ( name, proxy, retries = 0 ) => {
				// set new proxy
				browserOptions.args = [ `--proxy-server=${ proxy.proxy }` ];
				// create new browser
				const browser = await puppeteer.launch(browserOptions)
				// retun new promise
				let max_loop = 1;
				let loops = 0;
				while( loops < max_loop ){
						// go to the company
						await goto_company_search_page(browser);
						// input company name
						await input_company_name(browser, name);
						loops++;
				}
		}

		// create timeout process
		const create_callback = ( name, proxy, retries = 0) => 
				result =>  {
						// if there was an error
						if(result.error){ 
								// set proxy dead
								proxy_r.setDead(result.proxy);
								// stop trying if many tries
								if(result.retries > retries_max) 
										errored.add(name)
								else // let's try it again 
										//return create_promise( name, proxy_r.next(), retries + 1) 
										return
						}else // proxy was successfull
								checklist.check(name)
				}

		// set promise next function
		engine.setNextPromise( () => {
				let name = checklist.nextMissing()
				let proxy = proxy_r.next();
				let promise = create_promise( name, proxy )
				let callback = create_callback( name, proxy )
				return [ promise, callback ]
		});

		//set stop function
		engine.setStopFunction( () => {
				if(proxy_r.getAliveList().length === 0) return true
				else return false
		})
		// when fuffiled
		engine.whenFulfilled( result => 
				console.log(`[${result.proxy.proxy}] Fuffiled: ${result.name}`)
		)
		// when rejected
		engine.whenRejected( result => 
				console.log(`[${result.proxy.proxy}] Rejected: ${result.name} with ${result.error}`)
		)
		//engine.whenResolved(isResolved_callback);
		await engine.start()
		// done message
				.then(() => console.log("done =)"))

}

//main();
 
export default main
