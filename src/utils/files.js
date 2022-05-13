import fs from 'fs'

const write_json = (obj, path) => {
		try{
				let str = JSON.stringify(obj)
				fs.writeFileSync(path, str);
				return true
		}catch(e) {
				console.error('could not write file');
				console.error(e)
				return false
		}
}

const read_json = path => {
		try{
				let str = fs.readFileSync(path);
				return JSON.parse(str)
		}catch(e) {
				console.error('could not read file ' + e);
				return null
		}
}

const mkdir = path => 
		fs.access(path, (error) => {
				if (error) {
						// If current directory does not exist then create it
						fs.mkdir(path, { recursive: true }, (error) => {
								if (error) {
										console.log(error);
								} else {
										console.log(`${path} created successfully !!`);
								}
						});
				} else {
						console.log("Given Directory already exists !!");
				}
		});

export { getText, read_json, mkdir }
