import { read_json, write_json, delete_json } from './utils/files.js'


/* this class make a list that is saved disk, and or read from */
class DiskList{
		constructor(name, values = null){
				this.dir_path = '../data/resources/lists/';
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
		/* this function takes list of name name to check and */
		constructor(name, values){
				// only for script
				this.dir_path = './data/resources/checklist/';
				this.name = name + ".json";
				this.filename = this.dir_path + this.name
				this.checklist = read_json( this.filename );
				this.values = values;
				this.missing_values = [];
				// make chekilist
				if(!this.checklist){
						this.checklist = {};
						for(let value of this.values){
								if(this._isObject(value)) 
										value = JSON.stringify(value)
								this.checklist[value] = false
						}
				}
				this._calcMissing();
				// save new checklist
				write_json(this.checklist, this.filename);
		}

		_isObject = (objValue) => 
				( objValue && 
						typeof objValue === 'object' && 
						objValue.constructor === Object );

		_calcMissing = () => {
				this.missing_values = [];
				this.values.forEach( value  => { 
						if(this._isObject(value)) 
								value = JSON.stringify(value)
						if(! value in this.checklist)
								this.missing_values.push(value)
				})
		}

		getMissingValues = () => 
				this.missing_values;

		missingLeft = () => 
				this.missing_values.length

		nextMissing = () => 
				this.missing_values.shift();

		check = (value, mark = true) => {
				console.log(value);
				if(this._isObject(value)) 
						value = JSON.stringify(value)
				this.checklist[value] = mark;
				this._calcMissing();
				return write_json(this.checklist, this.dir_path + this.name);
		}

		isCheckedOff = value => {
				if(this._isObject(value)) 
						value = JSON.stringify(value)
				return this.checklist[value]
		}

		delete = () =>  { 
				this.values = []
				this.checklist = []
				delete_json( this.dir_path + this.name)
		}

}

export { Checklist, DiskList }
