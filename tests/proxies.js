import { ProxyRotator } from '../src/proxies.js'
import PromiseEngine from '../src/PromiseEngine.js';
import { read_json } from '../src/utils/files.js';
import { Checklist } from '../src/progress.js';
import goto_page from '../src/states/myip.com/goto_page.js'
import extract_ip from '../src/states/myip.com/extract_ip.js'
import puppeteer from 'puppeteer';

// options of browser
let browserOptions = read_json('./options.json').browser;

async function main(){
		let engine = new PromiseEngine(1);
		let proxy_r = new ProxyRotator();
		let proxy_list = proxy_r.getList();
		let checklist = new Checklist('testProxies', proxy_list);
		let banded_proxies = [];
		let error_max = 5;

		// set timeout 1000ms * 60s * 1m
		engine.setTimeout(1000 * 60 * 1/2 );

		// create timeout process
		const create_promise = async ( proxy, retries = 0 ) =>  {
				// set new proxy
				browserOptions.args = [ `--proxy-server=${ proxy.proxy }` ];
				// create new browser
				const browser = await puppeteer.launch(browserOptions)
				// retun new promise
				return new Promise( async ( resolve, reject ) => {
						let max_state_tries = 3;
						let state_tries = 0;
						while( state_tries < max_state_tries ){
								try{ // if empty browser go to target page
										//console.log("this ran");
										await goto_page(browser);
										// try to extract ip
										let ip = await extract_ip(browser, proxy);
										// check the result
										if(ip) resolve({ ip, proxy, tries })
										else reject({ proxy, error:'Could not get ip' })
								}catch(e) {
										throw e;
										//reject({ proxy, error:'Something whent wrong' });
								}
								state_tries ++;
						}
				}).catch(e => { throw e })
		}

		// create timeout process
		const create_callback = ( proxy, retries = 0) => 
				async result =>  {
						console.log("callback ran");
						// if there was an error
						if(result.error){ 
								// set proxy dead
								proxy_r.setDead(result.proxy);
								// stop trying if many tries
								if(result.retries > 5) 
										banded_proxies.push(proxy)
								else // let's try it again 
										return create_promise( proxy, retries + 1) 
						}else // proxy was successfull
								checklist.check(proxy)
				}

		// set promise next function
		engine.setNextPromise( () => {
				let proxy = proxy_r.next();
				let promise = create_promise( proxy )
				let callback = create_callback( proxy )
				return [ promise, callback ] 
		});

		//set stop function
		engine.setStopFunction( () => {
				if(proxy_r.getAliveList.length === 0) return true
				else return false
		})
		// when fuffiled
		engine.whenFulfilled(
				result => console.log(`resolved: ${result.proxy} with ip: ${result.ip}`)
		)
		// when rejected
		engine.whenRejected(
				result => console.log(`rejected: ${result.proxy} with error: ${result.error}`)
		)
		//engine.whenResolved(isResolved_callback);
		await engine.start()
		// done message
				.then(() => console.log("done =)"))

}

main();
