import make_state from '../makeState.js';
import waitUntilRequestDone from '../../utils/waitForNetworkIdle.js'
import getText from '../../utils/getText.js';
import { save_cookies } from '../../utils/cookies.js'

// target 
let target_url = 'https://www.myip.com/'

// make home page condition
const is_in_page = async browser => {
		// if it dow not have a page yet, and it is at null url
		console.log( (await browser.pages() )[0].url() );
	let result =	( await browser.pages() ).length === 1 &&
				(( await browser.pages() )[0].url() === target_url )
		if(result) console.log('condition is true')
		else console.log('condition is false')
		return result;
}

const extract_ip_and_exit_script = async (browser, proxy) => {
		// get page
		let page = ( await browser.pages() )[0];
		console.log('extracting ip')
		// wait a second
		//await waitUntilRequestDone(page, 100)
		// select public ip
		let ip_span = ( await page.$x('//span[@id="ip"]') )[0];
		// get ip
		let ip = await getText(ip_span);
		// save them cookies
		await save_cookies(page)
		// close browser
		await browser.close();
		if(ip) // go to initial login page 
				return ip // return if successfull
		else // somthing whent wrong
				throw new Error('could not get ip' )
}

// make state
export default make_state( 
		is_in_page,
		extract_ip_and_exit_script
)
