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
const create_timeout_promise = 
		async ( names, missing_index, proxy, retries = 0 ) => {
				let timeout_base = 1000
				let name = names[missing_index];
				let index = missing_index;
				//console.log( 'created proomise:', { name, index, proxy, retries, } )
				if(name) 
						return new Promise( async ( resolve, reject ) => 
								// make promise
								setTimeout( () => {
										if( Math.random() < 0.5 ) resolve({ name, index, proxy, retries, })
										else reject({ name, index, proxy, retries, error: "coin flip failed", })
								}, timeout_base * Math.random() )
						).catch(e => { throw e })
		}
		
// setters and getting for saving the checklist
const checklist_filename = './data/resources/checklist/timeout_test_checklist.json';
const save_checklist = checklist => write_json(checklist, checklist_filename);
const get_checklist = () => read_json(checklist_filename) ?? [];

// start and check integiry of the missing items
const check_timeout_integrity = (names, checklist) => {
		let missing = [];
		let table = Array(names.length).fill(null);
		// for every name
		names.forEach( ( name, index ) => { 
				// check if it is checklist 
				if(checklist.includes(name)) table[index] = name;
				// save index as missing
				else missing.push(index);
		})
		return [ missing, table ];
}

async function main(){
		/* the main show */
		let engine = new PromiseEngine(1);
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
				console.log(
						`rejected: ${error.name}. retries: ${error.retries} with error: ${error.error}`
				);
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

		const isFulfilled_callback = result => {
				if(!result){ 
						console.log('got null result')
						return 
				}
				// if it was successfull
				console.log(`fulfilled: ${result.name} with: ${result.proxy.proxy}`);
				// set proxy as alive
				proxy_r.setAlive(result.proxy);
				// mark name to checklist at index
				if(result === null) throw new Error("result is null")
				checklist[result.index] = result.name;
				// save checklist
				save_checklist(checklist);
		}

		const stopFunction = () => {
				if(missing_indexes.length === 0) return true
				else return false
		}
		
		/* timeout test */
		// get missing and check integrity
		[ missing_indexes, checklist ] = check_timeout_integrity(names, checklist)
		// saved checked list
		console.log(missing_indexes)
		save_checklist(checklist);
		// set promise next function
		engine.setNextPromise( () => { 
				let missing_index = missing_indexes.shift();
				let proxy = proxy_r.next();
				let promise = create_timeout_promise( names, missing_index, proxy );
				let callback = result => {
								console.log('CALLBACK RAN:');
								console.log(result);
						};
				return [ promise, callback ]
		});
				// set timeout 1000ms * 60s * 2
				engine.setTimeout(1000 * 60 * 2);
				//set stop function
				engine.setStopFunction(stopFunction);
				// set call backs 
				engine.whenRejected(isRejected_callback);
				engine.whenFulfilled(isFulfilled_callback);
				// start
				await engine.start()
				// done message
						.then(() => console.log("done =)"))
		}

main();
