/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
import {getPropertyEntry, getPrototype} from './index'
import { PropertyValue } from './PropertyValue';
import { ListPropertyValue } from './index';
import { watch } from 'vue';

export function EntityProxy(entityType: string, entityId: EntityId, context?:Object){
	const proto = getPrototype(entityType);
	const handlers = {
		get({entityType,entityId,proto,context},prop){
			if(prop === 'hasOwnProperty'){
				return ownProp=>handlers.has({entityId,entityType,proto},ownProp);
			}
			if(prop === Symbol.toStringTag || prop === 'toString'){
				return ()=>`${entityType}:${entityId}`
			}
			if(prop === 'toJSON'){
				return ()=>({$type:entityType,$id:entityId});
			}
			if(prop==='then'){
				return undefined;
			}
			if(prop === '$type' || prop === 'entityType'){
				return entityType;
			}
			if(prop === '$id'||prop==='entityId'){
				return entityId;
			}
			if(prop === '$key'){
				return entityType + '\x01' + entityId;
			}
			if(proto[prop]){
				return proto[prop](entityId,entityType);
			}
			if(prop==='isEntityProxy'){
				return true;
			}
			const entry = getPropertyEntry(entityType,entityId, prop.toString(),context);
			if(entry instanceof PropertyValue){
				return entry.value;
			}
			if(entry !== undefined && entry.isListValue){
				if(entry.status === "loading"){
					return new Promise(resolve=>{
						watch(entry,()=>{
							if(entry.status !== "loading"){
								resolve(entry.valueList)
							}
						})
					})
				}else{
					return entry.valueList;
				}
			}
		},
		has(target, p) {
				if(['$type','$id','isEntityProxy','toString','toJSON','$key'].includes(p.toString())){
					return true;
				}
				const value = this.get(target,p);
				return value !== undefined;
		},
		/*getOwnPropertyDescriptor(target,prop){
			if(this.has(target,prop)){
				return {
					writable:false,
					value: this.get(target,prop)
				}
			}
		}*/
	}
	return new Proxy({entityType,entityId,proto,context},handlers)
}


function listProxy(listEntry: ListPropertyValue){
	return new Proxy(listEntry,{
		get(listEntry,p){
			if(p==='length'){
				return listEntry.valueList.length;
			}
		}
	})
}
