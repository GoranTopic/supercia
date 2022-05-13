import puppeteer from 'puppeteer';

/*@ decorator to create a browser is it has been not passed*/
const initBrowserDecorator = func =>
		async function(browser=null) {
				let browserNotPassed = (browser)? false : true
				// if browser is not passed
				if( browserNotPassed ) browser = await puppeteer.launch();
				// wrap function 
				const result = await func(browser);
				// close browser if we opened it 
				if( browserNotPassed ) await browser.close();
				// return result of wrapped function
				return result;
		}

export { initBrowserDecorator }
