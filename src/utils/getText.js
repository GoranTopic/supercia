async function getText(elementHandler){
		/* this function make my life easier by just printin the txt content of a elementHandler */
		if(!elementHandler) throw Error('Got null constructor value in getText');
		// handle elementHandler
		const handleElement = async element => {
				//console.log('name:', element.constructor.name)
				if( element.constructor.name === 'ElementHandle' ){
						const textContent  = await element.getProperty('textContent');
						return await textContent.jsonValue();
				}else{
						console.error(`getText: got instance of ${element.constructor.name}
								instead of ElementHandle`)
						return null
				}
		}
		// handle multiple elements
		if( elementHandler instanceof Array ){ 
				// if it is a array of ElementHandle
				let strings = []; 
				for(let i = 0; i < elementHandler.length; i++)
						strings.push( await handleElement(elementHandler[i]) )
				return strings; // return array of strings
		}else // handle just one element
				return await handleElement(elementHandler);
}

export default getText;
