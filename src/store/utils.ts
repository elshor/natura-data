/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
export function isPromise(x:any){
	return x !== undefined && x !== null && typeof x.then === 'function';
}


export function v(x,context){
	if(typeof x === 'function'){
		return x(context);
	}else{
		return x;
	}
}

