/* getter an setter for cookie files */
import fs from 'fs'
// cookie file
const cookies_filename = './data/resources/cookies/cookies.json'

const save_cookies = async page =>{
		/* this function save from the browser */
		try{
				const cookies = await page.cookies();
				const cookieJson = JSON.stringify(cookies);
				fs.writeFileSync(cookies_filename, cookieJson);
				return true
		}catch(e) {
				console.error('could not write cookies');
				console.error(e)
				return false
		}
}

const read_cookies = async page => {
		/* this function save from the browser */
		try{
				const cookies = fs.readFileSync(cookies_filename, 'utf8');
				const deserializedCookies = JSON.parse(cookies);
				await page.setCookie(...deserializedCookies);
		}catch(e) {
				console.error('could not read cookies');
				return null
		}
}

export { save_cookies, read_cookies }
