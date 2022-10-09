/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
import axios from 'axios';
declare var context: any;
declare var gatewayServer : any;
type Context = {
	get?: (name:string) => string
}
export async function gateway(req,context:Context={}){
	const token = context.get? context.get('userToken') : await getUserToken();
	if(!req.headers){
		req.headers = {};
	}
	req.headers['X-NATURA-GATEWAY'] = req.url;
	req.headers['X-NATURA-TOKEN'] = token;
	req.url = gatewayUrl();
	const ret = axios(req);
	ret.then(()=>{
	}).catch(e=>{

		console.error('gateway request',req.url,'got exception',e);
	})
	return ret;
}


const waiting = {};
let lastUserToken = null;
async function getUserToken(){
	if(typeof lastUserToken === 'string'){
		//token was already retreived - send it
		return lastUserToken;
	}
	if(typeof window !== 'undefined'){
		lastUserToken = await query('user token');
		return lastUserToken;
	}else if(typeof context !== 'undefined'){
		return context.token;
	}else{
		throw new Error('Cannot get user token. Unknown environment');
	}
}

function query(topic:string,data:any=undefined){
	return new Promise((resolve,reject)=>{
		const id = uid();
		waiting[id] = {resolve,reject};
		if(typeof window !== 'undefined'){
			window.parent.postMessage([topic,data,id],'*');
		}else{
			console.error('cannot query parent - you are not in a windows environment')
		}
	})
}

if(typeof window !== 'undefined'){
	if(window.self !== window.top){
		window.addEventListener('message',evt=>{
			if(Array.isArray(evt.data)){
				const id = (evt.data.length === 3)?
				evt.data[2] :
				evt.data[1] || 0
				const data = (evt.data.length === 3)? 
					evt.data[1] : 
					undefined;
				const topic = evt.data[0];
				if(topic === 'response'){
						//this is a response to a previous request
						if(waiting[id]){
							waiting[id].resolve(data);
							delete waiting[id];
						}
				}else if(topic === 'error' && waiting[id]){
						waiting[id].reject(evt.data[1]);
						delete waiting[id];
				}
			}
		})
	}
}

function gatewayUrl(){
	if(typeof window !== 'undefined' && window.location.host.startsWith('localhost:')){
		return 'http://localhost:3000/data/gateway';
	}else if(typeof gatewayServer !== 'undefined'){
		return gatewayServer;
	}else{
		return 'https://ide.natura.dev/data/gateway'
	}
}

export function uid(){
	const ret = (Number(new Date()) - Number(new Date('2020-01-01'))+Math.random()).toString(36).replace('.','');
	return ret;
}
