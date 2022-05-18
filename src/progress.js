import { read_json, write_json, delete_json } from './utils/files.js'


/* this class make a list that is saved disk, and or read from */
class DiskList{
		constructor(name, values = null){
				this.dir_path = './data/resources/lists/';
				this.name = name + ".json";
				// try to read already saved values 
				if(values){ // if values have be passed
						this.values = values;
						write_json(this.values, this.dir_path + this.name);
				}else // try to read from disk
						this.values = read_json( this.dir_path + this.name) ?? [];
		}			
		// save value
		add = value => {
				this.values.push(value);
				return write_json(this.values, this.dir_path + this.name);
		}
}


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
				let new_checklist = Array(values.length).fill(false);
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

		check = (value, mark = 0) => {
				let index = this._get_index(value);
				if(mark) this.checklist[index] = mark;
				else this.checklist[index] = value;
				return write_json(this.checklist, this.dir_path + this.name);
		}

		isCheckedOff = value => {
				let index = this._get_index(value);
				return this.checklist[index]
		}

		delete = () =>  { 
				this.values = []
				this.checklist = []
				delete_json( this.dir_path + this.name)
		}

}

export { Checklist, DiskList }
