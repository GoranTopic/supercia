import { ProxyRotator } from '../src/proxies.js'
import { read_json } from '../src/utils/files.js';
import PromiseEngine from '../src/PromiseEngine.js';
import { Checklist } from '../src/progress.js';

async function main(){
		/* the main show */
		let engine = new PromiseEngine(1000);
		let proxy_r = new ProxyRotator();
		let names = read_json('./data/mined/company_names.json');
		let checklist = new Checklist('testTimeout', names);
		
		// get missing and check integrity
		let errored_values = [];
		let error_max = 100;
		
		// create timeout process
		const create_timeout_promise = async ( name, proxy, retries = 0 ) => {
						let timeout_base = 1000 * 60 * 0.001
						if(name) 
								return new Promise( async ( resolve, reject ) => 
										// make promise
										setTimeout( () => {
												if( Math.random() < 0.5 ) resolve({ name, proxy, retries, })
												else reject({ name, proxy, retries, error: "coin flip failed", })
										}, timeout_base * Math.random() )
								).catch( result => result)
				}


		// set stop function
		engine.setStopFunction(() => {
				if(checklist.missingLeft() === 0) return true
				else return false
		})

		// set promise next function
		engine.setNextPromise( () => { 
				let proxy = proxy_r.next();
				let name = checklist.nextMissing();
				let promise = create_timeout_promise( name, proxy );
				let callback = create_timeout_callback( name, proxy );
				return [ promise, callback ]
		});

		// create callback function 
		const create_timeout_callback = (name, proxy) => 
				result => {
						// if there was an error
						if(result.error){ 
								console.log(
										`rejected: ${result.name} retries: ${result.retries} with error: ${result.error}`
								);
								// set proxy as dead
								proxy_r.setDead(result.proxy);
								// if there have been many tries before
								if(result.retries > error_max){
										// set new missing value to errored
										errored_indexes.push(result.index);
								}else // same missing value, new proxy, +1 tried  
										return create_timeout_promise( 
												name, proxy_r.next(), result.retries + 1 
										)
						}
				}
		// set logger to know what is being rejected or fuffiled
		engine.whenFulfilled( result => { 
				if(result === null) throw new Error("result is null")
				// if it was successfull
				console.log(`fulfilled: ${result.name} with: ${result.proxy.proxy}`);
				// set proxy as alive
				proxy_r.setAlive(result.proxy);
				// save checklist
				checklist.check(result.name)
		});
		// when rejected
		engine.whenRejected( 
				result => console.log(
						`rejected: ${result.name}. retries: ${result.retries} with error: ${result.error}`
				)
		);

		// set timeout 1000ms * 60s * 2
		engine.setTimeout(1000 * 60 * 2);

		// start
		await engine.start()
		// done message
				.then(() => console.log("done =)"))
				.catch(e => console.log(e))
}

main();
