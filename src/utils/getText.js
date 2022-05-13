async function getText(elementHandler){
		/* this function make my life easier by just printin the txt content of a elementHandler */
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
		if( elementHandler instanceof Array ){ // handle multiple elements
				let strings = []; // if it is a array of ElementHandle
				for(let i = 0; i < elementHandler.length; i++)
						strings.push( await handleElement(elementHandler[i]) )
				return strings; // return array of strings
		}else // handle just one element
				return await handleElement(elementHandler);
}

export default getText;
