export default class PromiseEngine {
		/* the engine */
		constructor(concorrent_promises){
				this.concorrent_promises = concorrent_promises;
				this.stopFunction = this.stopFunction;
				this.halt = false;
				this.promises = Array(concorrent_promises).fill(null);
				this.nextPromise = null;
				this.promiseArray = null;
				this.promiseGen = null;
				this.stopFunction = null;
				this.timeout = null;
				this.fulfillmentCB = null;
				this.rejectionCB = null;
				this.resolvedCB = null;
		}

		// setters
		setStopFunction = stopFunction => this.stopFunction = stopFunction 
		setNextPromise =  nextPromise  => this.nextPromise = nextPromise;
		setPromiseList =  promiseArray  => this.promiseArray = promiseArray;
		setPromiseGen =  promiseGen  => this.promiseGen = promiseGen;
		setTimeout =  timeout  => this.timeout = timeout;
		whenFulfilled = fulfillmentCB => this.fulfillmentCB = fulfillmentCB;
		whenTimedOut = timeoutCB => this.timeoutCB = timeoutCB;
		whenRejected = rejectionCB => this.rejectionCB = rejectionCB;
		whenResolved = resolvedCB => this.resolvedCB = resolvedCB;

		/* returns a new from the promise soruces specified */
		_getNewPromise(){
				let newPromise = null;
				// if it is coming from an array
				if(this.promiseArray){ 
						// if array is empty
						if(this.promiseArray.length === 0){
								this.halt = true;
								throw new Error('list has no more values')
						}else{ 
								// get new value
								let result = this.promiseArray.shift();
								// if it has callback 
								if( result instanceof Array ){ 
										let callback = null;
										[ newPromise, callback ]  = result;
										newPromise.callback = callback;
										// if it doesnot have a callback
								}else newPromise = result;
						}
				}else if(this.nextPromise){
						// if it is coming from an function
						let next = this.nextPromise();
						if(!next){
								this.halt = true;
								throw new Error('next promise function gave null value')
						}else{
								// got callback
								if( next instanceof Array ){  
										let callback = null;
										[ newPromise, callback ] = next;
										newPromise.callback = callback;
								}else // no callback			
										newPromise = next
						}
				}else if(this.promiseGen){
						// if it is coming from an generator
						let next = this.promiseGen.next();
						if(next.done){
								this.halt = true;
								throw new Error('promise generator reached it end')
						}else{ // got callback
								if( next.value instanceof Array ){ 
										let callback = null;
										[ newPromise, callback ]  = next.value;
										newPromise.callback = callback;
								}else // no callback			
										newPromise = next.value
						}
				}else throw new Error('most set a promise source')
				if(newPromise === null) throw new Error('could not get new promise')
				else return newPromise
		}

		// this is a timeout 
		_timeoutAfter = timeout => new Promise(
				(resolve, reject) => {
						setTimeout(() => reject(new Error(`timed out`)), timeout);
				}
		)


		_promiseMonitor(promise) {
				/* promise wrapper for promise, a promise condom, if you will... */
				// Don't create a wrapper for promises that can already be queried.
				if (promise.isResolved) return promise;
				var callback = promise.callback ?? null;
				var isResolved = false
				var isFulfilled = false;
				var isRejected = false;
				var value = null;
				var result;
				// if it has timedout
				if(this.timeout){  
						var promises = [ promise, this._timeoutAfter(this.timeout) ]
						result = Promise.race(promises)
				}else
						result = promise

				// Observe the promise, saving the fulfillment in a closure scope.
				result.then(
						function(v) { isFulfilled = true; value = v; return v; }, 
						function(e) { isRejected = true; value = e; throw e; }
				).catch(e => { 
						throw e;
				}) 
				// getters
				result.getValue    = function() { return value };
				result.isResolved  = function() { return isFulfilled || isRejected };
				result.isFulfilled = function() { return isFulfilled };
				result.isRejected  = function() { return isRejected };
				if(callback) result.callback = function() { return callback( value ) };
				return result;
		}

		async start(){
				let result;
				// promises container
				this.promises = Array(this.concorrent_promises).fill(null);
				//if no stop function as been set run forever 
				if(this.stopFunction === null) this.stopFunction = () => false;
				else this.halt = this.stopFunction();
				// create promises
				for( let i = 0; i < this.promises.length; i++ )
						this.promises[i] = this._promiseMonitor( this._getNewPromise() )
				// start the loop
				while( !this.halt ){
						// check all processes
						await Promise.allSettled( this.promises )
								.then(() => { 
										//console.log('looping inside promise', this.halt);
										try{ // if all all have settled
												// if there is no process active
												for( let i = 0; i < this.promises.length; i++ )
														// for every every processes
												if(this.promises[i].isResolved()){
														// set new promise to none
														let newPromise = null;
														// if the promise has been resolved
														if(this.resolvedCB) //if ther is has a resolved cb, run it
																newPromise = this.resolvedCB( this.promises[i].getValue() ); 
														// if the promise as an attached callback
														if(this.promises[i].callback){
																newPromise = this.promises[i].callback(); 
														}
														// add it as a new promise
														// if promise if rejected
														if(this.promises[i].isRejected()) // if there was an error
																if(this.rejectionCB) // if a new promise has been returned
																		newPromise = this.rejectionCB( this.promises[i].getValue() );
														// if it was successfull
														if(this.promises[i].isFulfilled())
																//console.log('is fulfilled');
																if(this.fulfillmentCB) // if a new promise has been returned
																		newPromise = this.fulfillmentCB( this.promises[i].getValue() );
														// if no new promise has been set 
														if(newPromise) // if new promise has been passed
																this.promises[i] = this._promiseMonitor(newPromise);
														else // get new one
																this.promises[i] = this._promiseMonitor( this._getNewPromise() );
												}
												// run stop function
												this.halt = this.stopFunction();
												// is this working?
												if(this.promises.every( p => p.isResolved() ) ){
														//console.log(this.promises);
														this.halt = true
												}
												//if(loop_num ++ > loop_max) this.halt = true;
										}catch(e){
												this.halt = true;
												console.error(e);
										}
								})
				}
		}
}

