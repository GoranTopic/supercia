const make_state = (condition, script) => 
		/* this functions takes a condition and a script and 
		 * return a function that run the scrip the the condition is met */
		async (browser, name, debuging) =>  
		(await condition(browser, debuging)) &&
				( await script(browser, name, debuging) )


export default make_state;
