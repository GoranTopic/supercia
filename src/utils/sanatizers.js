const replace_nonbreak_spaces = input => {
		/* this functions takes a strinig or an array of string an replace them
		 * the jq nonbreking space with a regular space */
		let regex = new RegExp(String.fromCharCode(160), "g");
		return input instanceof Array ? 
				// handle multiple elements
				input.map( str => str.replace(regex, " ") ) :
				// handle just one element
				input.replace(regex, " ") ;
}

const clean_company_names = filepath => {
		/* remove obnoxious nonbreking space from string */
		let array = read_json(filepath)
		array = replace_nonbreak_spaces(array)
		console.log(array)
		write_json([ ...array], filepath)
}

export {  clean_company_names }
