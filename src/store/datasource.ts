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
		const page = prevPage? await this.getNextPage(prevPage) : await this.getFirstPage();
		if(!page){
			//no more pages
			return params.successCallback(data,this.rowCount);
		}
		if(page.endRow <= params.startRow){
			//this page is before required range - move to next page
			return this.loadPageRows(params,data,page,left);
		}
		if(page.startRow >= params.endRow){
			//we passed range. return data
			return params.successCallback(data,this.rowCount);
		}
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
	getFirstPage(){
		if(this.firstPage){
			return this.firstPage;
		}else{
			return this.loadPage();
		}
	}
	async getNextPage(prevPage: Page = null){
		const pageId = prevPage.nextPage;
		if(typeof pageId !== 'string'){
			//no next page
			return null;
		}
		if(this.pages.has(pageId)){
			return this.pages.get(pageId);
		}else{
			return this.loadPage(prevPage)
		}
	}
	async loadPage(prevPage?: Page) : Promise<Page>{
		const ds = this;
		const pageId = prevPage? prevPage.nextPage : null;
		const ret = new Promise((resolve,reject)=>{
			ds.loader({
				entityType: ds.entityType,
				entityId: ds.entityId,
				propertyName: ds.propertyName,
				onSuccess:resolve,
				onFail: reject,
				pageId,
				context: ds.context
			})
		}).then((ret)=>{
			//got page
			const page = ret as Page;
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
			return page as Page;
		}).catch(e=>{
			console.error('Exception loading page',e);
			throw e;
		})
		if(pageId !== null){
			this.pages.set(pageId,ret);
		}else{
			//this is first page
			this.firstPage = ret;
		}
		return ret;
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