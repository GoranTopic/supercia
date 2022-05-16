const make_state = (condition, script) => 
		/* this functions takes a condition and a script and 
		 * return a function that run the scrip the the condition is met */
		async (...args) => 
		(await condition(...args))? 
				( await script(...args) ) : null

export default make_state;
