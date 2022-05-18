import make_state from '../makeState.js';

// make home page condition
const has_browser = async browser => 
		// if it dow not have a page yet, and it is at null url
		(browser)? true : false
		

const close_browser_script  = async (browser, proxy) => {
		console.log('closing browser')
		// close browser
		await browser.close();
}

// make state
export default make_state( 
		has_browser,
		close_browser_script
)
