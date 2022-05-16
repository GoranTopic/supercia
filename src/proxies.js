import { initBrowserDecorator } from './utils/decorators.js';
import getText from './utils/getText.js';
import fs from 'fs';

const free_proxy_list_net = async page => {
		/* this functions parse the proxies form https://free-proxy-list.net/*/
		// waitin for selectos method and then for evey elemene, get the textContent?
		let proxies = []
		let selector = 'textarea' // they are a area wher they have the 
		await page.goto('https://free-proxy-list.net/');
		// raw txt fo the proxies, got this by printing the text from the entire page
		let element = await page.waitForSelector(selector)
		//let txtEls = await element.evaluate( el => el.textContent )
		proxies = await getText(element) 
		// split by newline
		proxies = proxies.split("\n")
		// remove 3 upper unwanted debries
		Array(3).fill().map( () => proxies.shift() );
		// remove 1 lower unwanted debries
		proxies.pop();
		return proxies
}

const scrapingant_free_proxies = async page => {
		/* this functions parse the proxies form https://scrapingant.com/free-proxies/*/
		let proxies = []
		// waitin for selectos method and then for evey elemene, get the textContent?
		await page.goto('https://scrapingant.com/free-proxies', {
				waitUntil: 'networkidle0', // wait until the page is fully loaded
		});
		// nice trick to see the whole content of the page
		let html = await page.content()
		// get the ip and port elements in the html table
		let elements = await page.$$('tbody > tr > td:nth-child(1), tbody > tr > td:nth-child(2)')
		// add ip address and port togetherj
		let texts = await getText(elements) 
		for (let i = 0; i < texts.length; i+=2) 
				proxies.push( texts[i] + ':' + texts[i + 1] )
		// split by newline
		return proxies
}

const get_free_online_proxies = 
		initBrowserDecorator( 
				/* parses the proxies form various websites */
				async browser => {
						const proxies = new Set()
						const addToSet = new_proxy => proxies.add(new_proxy)
						let new_proxies = []
						// make new page
						const page = await browser.newPage();
						console.log('opened new page..')
						// get from free-proxy-list.net
						await free_proxy_list_net(page)
								.then( new_proxies => // add them to set
										new_proxies.forEach(addToSet) )
						// get from scrapingant.com/free-proxies
						await scrapingant_free_proxies(page)
								.then( new_proxies => // add them to set
										new_proxies.forEach(addToSet) )
						// add them to st
						return proxies
				}
		)

const testProxies = async browser => {
				// make new page
				const page = await browser.newPage();
				console.log('opened new page..')
				// go to website
				await page.goto('');
		}
		
const get_premium_proxies = () => {
		let filename =  './data/resources/proxies/proxyscrape_premium_http_proxies.txt',
				proxies = [];
		try{
				let data = fs.readFileSync(filename, 'utf-8')
				proxies = data.split(/\r?\n/);
		}catch(e){
				console.log(e);
		}
		return proxies
}

class ProxyRotator {
		constructor(){
				this.queue = []
				this.dead = [];
				// 1000ms * 60s * 30m = 30m
				this.timeout_rate = 1000 * 60 * 30;
				// get initial proxies
				let initial_proxy_pool = [
						...get_premium_proxies()
				];
				// add the new proxies to the queue
				this.add_new_proxies(initial_proxy_pool);
		}

		find_proxy_by_str(str){
				// look for a single proxy with the str
				let proxy_pool = [ ...this.dead, ...this.queue ];
				return proxy_pool.filter( proxy => str === proxy )[0];
		}

		remove_proxy_from_all(str){
				// remove proxy from any list it is in
				this.queue = this.queue.filter( proxy => proxy.proxy !== str )
				this.dead = this.dead.filter( proxy => proxy.proxy !== str )
		}

		remove_proxy_from_queue(str){
				// remove proxy from queue
				this.dead = this.dead.filter( proxy => proxy.proxy !== str )
		}

		remove_proxy_from_dead(str){
				// remove proxy from any dead list
				this.queue = this.queue.filter( proxy => proxy.proxy !== str )
		}

		add_new_proxies(proxies){
				// with a list of proxies, add them to the queue
				proxies.forEach( proxy => 
						this.queue.push({
								status:'Unknown', 
								timeoutID: null,
								times_resurected: null,
								ip: proxy.split(':')[0],
								port: proxy.split(':')[1],
								proxy
						})
				)
		}

		str_param_decorator = func => 
				function(proxy){
						// if it is passed a str insted of obj, 
						if( proxy instanceof String )
								// ge the proxy obj
								proxy = find_proxy_by_str( proxy );
						return func( proxy )
				}

		async getOnlineFreeProxies() {
				// scrap online free proxies
				let new_proxies = await get_free_online_proxies();
				this.add_new_proxies(new_proxies);
		}

		next = () => {
				if(this.queue.length === 0){
						// there are not proxies
						console.error("no proxies in queue");
						return null ;
				}
				// remove from front 
				let proxy = this.queue.shift();
				// add to back
				this.queue.push(proxy);
				// return 
				return proxy
		}

		getAlive = () => {
				if(this.queue.length === 0){
						// there are not proxies
						console.error("no proxies in queue");
						return null ;
				}
				let proxy = null;
				for(let i =0;i<this.queue.length;i++)
						if( this.queue[i].status === "Alive"){
								// get first Alive proxy
								proxy = this.queue.splice(i,1);
								// add it to the end
								this.queue.push(proxy);
								// stop loop
								i = this.queue.length;
						}
				return proxy;
		}

		setAlive = this.str_param_decorator( proxy =>  {
				// if it is dead 
				if(proxy.status === "Dead")
						// bring it back to life
						this.resurect_proxy(proxy, "Alive")
				// if it is unknown
				else if(proxy.status === "Unknown")
						proxy.status = "Alive";
		})

		setDead = this.str_param_decorator( proxy =>  {
				this.remove_proxy_from_queue(proxy.proxy);
				proxy.status = 'Dead';
				if(proxy.timeoutID){
						clearTimeout(proxy.timeoutID)
						proxy.timeoutID = setTimeout( 
								this.resurect_proxy(proxy), 
								this.timeout_rate * ( proxy.times_resurected ?? 1 )
						);
				}
				this.dead.push(proxy);
		})

		getList = () => [ ...this.queue, ...this.dead ] 

		getAliveList = () => this.queue

		resurect_proxy( proxy, status="Unknown" ){
				this.remove_proxy_from_dead(proxy.proxy);
				proxy.status = status;
				proxy.times_resurected += 1;
				proxy.timeoutID = null;
				this.queue.push(proxy);
		}

}

export { ProxyRotator, testProxies, get_free_online_proxies, get_premium_proxies }
