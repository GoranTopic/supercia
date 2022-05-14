import { ProxyRotator, testProxies } from '../src/proxies.js'
import { read_json, write_json } from '../src/utils/files.js';
import { save_cookies, read_cookies } from '../src/utils/cookies.js'
import PromiseEngine from '../src/PromiseEngine.js';
import getText from '../src/utils/getText.js';
import puppeteer from 'puppeteer';

let options = read_json('./options.json');
let browserOptions = options.browser;

// create new browser
const start_new_browser = async ( proxy, options ) => {
		options.args = [ `--proxy-server=${ proxy.proxy }` ];
		//console.log(`launching browser with proxy: ${options.args}`);
		return ( await puppeteer.launch(options) );
}

// create timeout process
const create_proxy_test_promise = async ( index, proxy, retries = 0 ) =>  
		new Promise( async ( resolve, reject ) => {
				// make promise
				let target_url = 'https://www.myip.com/'
				// launch browser
				let browser = await start_new_browser(proxy, browserOptions);
				// get page
				let page = ( await browser.pages() )[0];
				// read cookies
				await read_cookies(page);
				//console.log(('got cookies'));
				// goto website  wait until the page is fully loaded
				//console.log('page to load');
				await page.goto( target_url, { waitUntil: 'domcontentloaded', });
				//console.log('network idle')
				// select public ip
				let ip_span = ( await page.$x('//span[@id="ip"]') )[0];
				// get ip
				let ip = await getText(ip_span);
				// save them cookies
				await save_cookies(page)
				// close browser
				await browser.close();
				// return if successfull
				if(ip) resolve({ index, ip, proxy })
				else reject({ index, ip, proxy, error: 'could not get ip' })
		}).catch(e => { throw e })

// setters and getting for saving the checklist
const checklist_filename = './data/resources/checklist/proxy_test_checklist.json';
const save_checklist = checklist => write_json(checklist, checklist_filename);
const get_checklist = () => read_json(checklist_filename) ?? [];

// start and check integiry of the missing items
const check_proxy_integrity = (names, checklist) => {
		let missing = [];
		let table = Array(names.length).fill(null);
		names.forEach( ( name, index ) => // just check if the something there
				checklist[index]?
				table[index] = checklist[index] : missing.push(index)
		)
		return [ missing, table ];
}

async function main(){
		/* the main show */
		let engine = new PromiseEngine(7);
		let proxy_r = new ProxyRotator();
		let checklist = get_checklist();
		let names = read_json('./data/mined/company_names_sample.json');
		let error_max = 3;
		let missing_indexes = [];
		let errored_indexes = [];

		const isResolved_callback = result => 
				console.log(`resolved: ${result.index}`);

		const isRejected_callback = error => {
				// if there was an error
				if(error.message === 'timed out'){
						console.error(error);
						return 
				}
				//console.log(errored_indexes);
				console.log(`rejected: ${error.name}.\n    retries: ${error.retries} with error: ${error.error}`);
				// set proxy as dead
				proxy_r.setDead(error.proxy);
				// if there have been many tries before
				if(error.retries > error_max){
						// set new missing value to errored
						errored_indexes.push(error.index);
				}else // same missing value, new proxy, +1 tried  
						return create_timeout_promise(
								names, error.index, proxy_r.next(), error.retries + 1 
						)
		}

		const whenProxyRejected = result => {
				// if there was an error
				if(result.message === 'timed out'){
						console.error(result);
						return 
				}
				console.log(`rejected: ${result.proxy}`);
				proxy_r.setDead(result.proxy);
				return create_proxy_test_promise( proxy_r.next() );
		}

		const whenProxyFufilled = result => {
				// if it was successfull
				console.log(`fulfilled: ${result.ip}`);
				// set proxy as alive
				proxy_r.setAlive(result.proxy);
				// mark name to checklist at index
				checklist[result.index] = result.ip;
				// save checklist
				save_checklist(checklist);
		}

		const stopFunction = () => {
				if(missing_indexes.length === 0) return true
				else return false
		}

		/* proxy test */
		// get missing and check integrity
		[ missing_indexes, checklist ] = check_proxy_integrity(names, checklist)
		// saved checked list
		console.log(missing_indexes)
		save_checklist(checklist);
		// set promise next function
		engine.setNextPromise( () => 
				create_proxy_test_promise( missing_indexes.shift(), proxy_r.next() )
		);
		// set timeout 1000ms * 60s * 1m
		engine.setTimeout(1000 * 60 * 1/2 );
		//set stop function
		engine.setStopFunction(stopFunction);
		// set call backs 
		engine.whenRejected(whenProxyRejected);
		engine.whenFulfilled(whenProxyFufilled);
		//engine.whenResolved(isResolved_callback);
		await engine.start()
		// done message
				.then(() => console.log("done =)"))

}

main();
