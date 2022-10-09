/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */

import { isPromise, v } from "./utils";

/**
 * extended get function, enabling get of collections with filters, sorts and specified number of items
 * @param def 
 */
export default function xget(def:GetDef,fn:Function){
	if(typeof def.access !== 'string' || !def.object === undefined){
		console.error('Error getter not defined correctly',def);
		return;
	}
	const objectFn = fn(def.object);
	const countFn = fn(def.itemCount);
	return function(context:any){
		const options = {
			count: v(countFn,context)
		}
		const object = v(objectFn,context);
		if(object === undefined){
			return [];
		}
		const data = object[def.access]
		if(isPromise(data)){
			return data.then(resolved=>processData(resolved,options));
		}else{
			return processData(data,options);
		}
	}
}
xget.isFactory = true;

type GetDef = {
	access: string;
	object : Object;
	itemCount: Number
}

function processData(data,{count}){
	if(Number.isInteger(count)){
		return data.slice(0,count);
	}else{
		return data;
	}
}
