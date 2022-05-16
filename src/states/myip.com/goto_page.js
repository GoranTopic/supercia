import make_state from '../makeState.js';
import { read_cookies } from '../../utils/cookies.js'

// target 
let target_url = 'https://www.myip.com/'

// make home page condition
const has_open_tab_and_null_url = async browser => 
		// if it dow not have a page yet, and it is at null url
		( await browser.pages() ).length === 1 &&
				( ( await browser.pages() )[0].url() )


// script to handle the home page
const goto_page_script = async browser => {
		// get page
		let page = ( await browser.pages() )[0];
		// read cookies
		await read_cookies(page);
		//console.log('page to load');
		await page.goto( target_url, { waitUntil: 'domcontentloaded', });
		//console.log('network idle')
}

// make home handle state
export default make_state( 
		has_open_tab_and_null_url,
		goto_page_script,
)
