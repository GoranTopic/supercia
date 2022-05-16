import { read_json, write_json, } from './utils/files.js'

/* this class makes a checklist for value that need to be check,
 * it takes a check function whihc goes throught the values. */
class Checklist{
		constructor(name, values){
				this.dir_path = './data/resources/checklist/';
				this.name = name + ".json";
				this.checklist = [];
				this.missing_values = [];
				this.values = values;
				this.checkFunc = null;
				this.addFunction = null;
				this.indexTable = {};
				/* this function takes list of name name to check and */
				// make a map of all the value and their indexes
				values.forEach( (v, i) => this.indexTable[JSON.stringify(v)] = i )
				// initiate que for missing values 
				this.missing_values = [];
				// try to read already set values 
				this.checklist = read_json( this.dir_path + this.name) ?? [];
				// make empty table to 
				let new_checklist = Array(values.length).fill(null);
				values.forEach( ( value, index ) => { 
						if(this.checkFunc){// if custom check function is set
								let res = this.checkFunc(value, checklist[index] ?? null);
								if(res) new_checklist[index] = res
								// check if it is checklist 
						}else if(this.checklist[index])
								new_checklist[index] = value;
						// save index as missing
						else this.missing_values.push(value);
				})
				this.checklist = new_checklist;
				// save new checklist
				write_json(this.checklist, this.dir_path + this.name);
		}

		setCheckFunction = checkFunc => this.checkFunc = checkFunc 

		getMissingValues = () => 
				this.missing_values;

		missingLeft = () => 
				this.missing_values.length

		nextMissing = () => 
				this.missing_values.shift();

		_get_index = value => this.indexTable[JSON.stringify(value)]

		check = value => {
				let index = this._get_index(value);
				this.checklist[index] = value;
				return write_json(this.checklist, this.dir_path + this.name);
		}

}

export { Checklist }
