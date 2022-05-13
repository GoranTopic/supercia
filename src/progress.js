/* this funtion make a a checklist for value that need to be check,
 * it takes a check function whihc goes throught the values. */
import { read_json, write_json, } from './utils.js'


class checklist{
		constructor(name){
				this.dir_path = './resources/generated/checklists/';
				this.name = name;
				this.checklist = read_json( this.dir_path + this.name ) ?? [];
				this.missing_values = [];
				this.checkFunc = null;
		}

		checkIntegrity(names){
				/* this function takes list of name name to check and */
				this.missing_values = [];
				// make empty table to 
				let new_checklist = Array(names.length).fill(null);
				names.forEach(( name, index ) => { 
						if(this.checkFunc){
								let res = this.checkFunc(name, checklist);
								if(res) new_checklist[index] = res
								// check if it is checklist 
						}else if(this.checklist[index])
								new_checklist[index] = name;
						// save index as missing
						else this.missing_values.push(index);
				})
				this.checklist = new_checklist;
				write_json(this.checklist, this.dir_path + this.name);
				return this.missing_values;
		}

		setCheckFunction = checkFunc => this.checkFunc = checkFunc 

		getMissingFile = () => 
				this.missing_values;
		

		nextMissing = () => 
				this.missing_values.shift();
		
		
		add = (value, index) => {
				this.checklist[index] = value;
				return write_json(this.checklist, this.dir_path + this.name);
		}

}
