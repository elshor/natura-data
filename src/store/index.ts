/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
export {EntityProxy} from './EntityProxy'
export {ListPropertyValue} from './ListPropertyValue'
import Datasource from './datasource'
import '../types/store'
import {shallowReactive} from 'vue'
import { PropertyValue } from './PropertyValue';
import { ListPropertyValue } from './ListPropertyValue';
export {Datasource};

const LOADER_WAIT_MS = 300;
const entityMap = new Map<string,any>();
const loadersMap = new Map<string,Function>();
const pageLoadersMap = new Map<string,PageLoaderFunction>();
const prototypes = new Map<string,Object>();


function key(entityType:String, entityId: String){
	return entityType + '\x01' + entityId;
}

export function storeProperty(entityType:string,entityId:string, property:string, propertyValue:any){	
	let entry = entityMap.get(key(entityType,entityId));
	if(!entry){
		entry = {};
		entityMap.set(key(entityType,entityId),entry);
	}
	if(entry[property]){
		entry[property].update(propertyValue);
	}else{
		entry[property] = new PropertyValue(propertyValue);
	}
}

export function errorLoadingProperty(entityType:string,entityId:string, property:string, error: ErrorObject){	
	let entry = entityMap.get(key(entityType,entityId));
	if(!entry){
		return;
	}
	if(entry[property]){
		entry[property].fail(error);
	}
}


export function startLoadingProperty(
	entityType:string,
	entityId:string, 
	property:string
){	
	let entry = entityMap.get(key(entityType,entityId));
	if(!entry){
		entry = {};
		entityMap.set(key(entityType,entityId),entry);
	}
	const updatedEntry = entityMap.get(key(entityType,entityId));
	if(updatedEntry[property] === undefined){
		updatedEntry[property] = new PropertyValue();
	}
	updatedEntry[property].startLoading();
}

export function storeListProperty(
	entityType:string, 
	entityId:string, 
	property:string,
	status: ValueStatus,
	firstValuePos: number=0,
	values:Array<any>=[],
	state: Object={}){
	let entry = entityMap.get(key(entityType,entityId));
	if(!entry){
		entry = {};
		entityMap.set(key(entityType,entityId),entry);
	}
	if(entry[property]){
		entry[property].update(values,firstValuePos, state);
		entry[property].updated = new Date();
	}else{
		entry[property] = shallowReactive(new ListPropertyValue(values,firstValuePos, state));
	}
	entry[property].setStatus(status);
}

export function getPropertyEntry(
	entityType:string,
	entityId:string, 
	propertyName:string, 
	context?: Object
) : any{
	const entry = entityMap.get(key(entityType,entityId));
	if(entry && entry[propertyName] !== undefined){
		return entry[propertyName];
	}

	//check if property loader exists
	if(loadersMap.has(key(entityType,propertyName))){
		//loader exists - initialize property
		startLoadingProperty(entityType,entityId,propertyName)
		
		//add loader to queue
		const loader = loadersMap.get(key(entityType,propertyName));
		addToLoaderQueue(loader,entityId,propertyName,entityType)
		const updatedEntry = entityMap.get(key(entityType,entityId));
		return (updatedEntry && updatedEntry[propertyName])? updatedEntry[propertyName] : undefined;
	}

	//check if page loader exists (for collections)
	if(pageLoadersMap.has(key(entityType,propertyName))){
		const loader = pageLoadersMap.get(key(entityType,propertyName));
		const datasource = new Datasource({entityType,entityId,propertyName,loader,context});
		storeProperty(entityType,entityId,propertyName,datasource);
		const updatedEntry = entityMap.get(key(entityType,entityId));
		const ret = updatedEntry[propertyName];
		return ret;
	}

	return undefined;
}

export function registerPropertyLoader(
	entityType:string,
	propertyName:string,
	loader:PropertyLoaderFunction
){
	loadersMap.set(key(entityType,propertyName),loader);
}

export function registerPageLoader(
	entityType:string,
	propertyName:string,
	loader:PageLoaderFunction
){
	pageLoadersMap.set(key(entityType,propertyName),loader);
}

export function registerPropertyGetter(entityType:string,propertyName:string,getter:PropertyGetter){
	const proto = getPrototype(entityType);
	proto[propertyName] = getter;
}

export function getPrototype(entityType: string){
	const ret =  prototypes.get(entityType);
	if(ret){
		return ret;
	}else{
		const newPrototype = {};
		prototypes.set(entityType,newPrototype);
		return newPrototype;
	}
}
type LoaderTask = {
	loader: Function;
	entityId: string;
	propertyName: string;
	entityType : string;
}

let loaderQueue: Array<LoaderTask> = [];
let loaderTimer: any = 0;

function addToLoaderQueue(loader:Function,entityId:string,propertyName:string,entityType:string){
	loaderQueue.push({loader,entityId,propertyName,entityType});
	if(loaderTimer === 0){
		loaderTimer = setTimeout(processLoaderQueue,LOADER_WAIT_MS);
	}
}

function processLoaderQueue(){
	while(loaderQueue.length > 0){
		const loader = loaderQueue[0].loader;
		const queries: Array<PropertyQuery> = loaderQueue
			.filter(task=>task.loader === loader)
			.map(({entityId,propertyName,entityType})=>({entityId,propertyName,entityType}));
		//only leave items that do not have this loader
		loaderQueue = loaderQueue.filter(task=>task.loader !== loader);

		//call loader
		loader(queries);

		//reset timer
		loaderTimer = 0;
	}
}