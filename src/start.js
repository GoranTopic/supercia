import { ProxyRotator, testProxies } from './proxies.js'
import { read_json }  from './utils/files.js'
import PromiseEngine from './PromiseEngine.js';
import scrapper from './scrapers/company_scrapper.js'

const promiseEngine = null;
const proxyRotator = null;

const new_promise = async () => New Promise.race
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
										else reject({ name, index, proxy, retries, error: "coin flip falied", })
								}, timeout_base * Math.random() )
						).catch(e => { throw e })
		}

}

function setup() {
		/* this funtions run the initial set up nessary to start the scrapping process 
		 * it mainly read from the options.json and creates a promise engine with a proxy rotator*/
		// read options
		const options  = read_json('../options.json')
		// get number of concurrent promises
		const concurrent_promises = options.concurrent_processes
		//  
		
		const whenPromiseRejected = result => {
				// if there was an error
				if(result.message === 'timed out'){
						console.error(result);
						return 
				}
				console.log(`rejected: ${result.proxy}`);

				if(options.proxyRotation) 
						proxy_r.setDead(result.proxy);
				return create_proxy_test_promise( proxy_r.next() );
		}

		const whenPromiseFufilled = result => {
				// if it was successfull
				console.log(`fulfilled: ${result.proxy.proxy}`);
				// set proxy as alive
				proxy_r.setAlive(result.proxy);
				// mark name to checklist at index
				checklist[result.index] = result.proxy.proxy;
				// save checklist
				save_checklist(checklist);
		}

		const proxy_test = async () => {
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


}
// run setup
setup();

function start_scrap =() => {


}



export default start;

