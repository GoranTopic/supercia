import fs from 'fs'

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

export default mkdir
