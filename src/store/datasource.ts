/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
import { isPromise } from "./utils";
import dataSlice from './data-slice'
import  '../types/store'
export default class Datasource{
	entityType: string;
	entityId: string;
	propertyName: string;
	context: Object;
	loader: PageLoaderFunction;
	pages: Map<string,PageOrPromise> = new Map<string,PageOrPromise>();
	rowCount: number;
	firstPage: PageOrPromise;	
	constructor(o:DataSourceOptions){
		this.entityType = o.entityType;
		this.entityId = o.entityId;
		this.propertyName = o.propertyName;
		this.loader = o.loader;
		this.context = o.context;
	}

	get isDatasource() : boolean{
		return true;
	}

	async loadPageRows(
		params: GetRowsParams, 
		data: Array<any>, 
		prevPage?:Page,
		left?:number
	){
		left = left || (params.endRow - params.startRow);
		const resolve = page=>{
			if(!page){
				//no more pages
				params.successCallback(data,this.rowCount);
			}else if(page.endRow <= params.startRow){
				//this page is before required range - move to next page
				this.loadPageRows(params,data,page,left);
			}else if(page.startRow >= params.endRow){
				//we passed range. return data
				params.successCallback(data,this.rowCount);
			}else{
				const firstIndex = Math.max(params.startRow-page.startRow,0);
				const loadCount = Math.min(left,page.data.length-firstIndex);
				for(let i = firstIndex;i<(loadCount+firstIndex);++i){
					data.push(page.data[i]);
				}
				if(left > loadCount){
					//need to load more
					this.loadPageRows(params,data,page,left-loadCount)
				}else{
					//completed load
					params.successCallback(data,this.rowCount);
				}
			}
		}
		const reject = (e:any)=>params.failCallback(e);
		if(prevPage){
			this._getNextPage(resolve, reject, prevPage)
		}else{
			this._getFirstPage(resolve, reject)
		}
	}
	_getFirstPage(resolve:Function, reject:Function){
		if(this.firstPage){
			resolve(this.firstPage);
		}else{
			this._loadPage(resolve, reject);
		}
	}
	async _getNextPage(resolve:Function, reject: Function, prevPage: Page = null){
		const pageId = prevPage.nextPage;
		if(typeof pageId !== 'string'){
			//no next page
			resolve(null);
		}
		if(this.pages.has(pageId)){
			resolve(this.pages.get(pageId));
		}else{
			this._loadPage(resolve, reject, prevPage)
		}
	}
	_loadPage(resolve:Function, reject: Function, prevPage?: Page){
		const ds = this;
		const pageId = prevPage? prevPage.nextPage : null;
		ds.loader({
			entityType: ds.entityType,
			entityId: ds.entityId,
			propertyName: ds.propertyName,
			onSuccess: (page)=>{
				//got page
				page.startRow = prevPage? prevPage.endRow : 0;
				page.endRow = page.startRow + page.data.length;
				if(!page.nextPage){
					//reached end page - set total count
					ds.rowCount = page.endRow
				}
				if(pageId !== null){
					//this is not first page
					ds.pages.set(pageId,page);
				}else{
					ds.firstPage = page;
				}
				resolve(page);
			},
			onFail: (message, data)=>{
				reject(data || message);
			},
			pageId,
			context: ds.context
		})
	}
	slice(startRow:number,endRow:number){
		return dataSlice(this,startRow,endRow);
	}

	getRows(params: GetRowsParams){
		const data = [];
		this.loadPageRows(params,data)
	}
}

export function uid(){
	return (Number(new Date()) - 
		new Date('2020-01-01').getTime()+Math.random()).toString(36).replace('.','');
}