/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
type Page = {
	data: Array<any>;
	nextPage: string;
	prevPage: string;
	startRow?: number;
	endRow?: number;
}
type PageOrPromise = Promise<Page> | Page;

type PropertyQuery = {
	entityType: string;
	entityId: string;
	propertyName: string;
}

type ListPropertyQuery = {
	entityId: string;
	propertyName: string;
}

type PropertyLoaderFunction = (
	queries: Array<PropertyQuery>
) => void;

type PageLoaderFunction = (
	options: PageLoaderOptions
) => void;

type EntityId = string | number;
type PropertyGetter = (entityId: EntityId,entityType?:string) => any;

type PageLoaderOptions = {
	entityType?:string,
	entityId?:EntityId,
	propertyName:string,
	context?:Object,
	count?: number,
	pageId?:string
	onSuccess: LoadPageSuccess,
	onFail: LoadPageFail
}
type LoadPageSuccess = (page:Page)=>void;
type LoadPageFail = (message:string)=>void;
type ValueStatus = "loading"|"complete"|"partial"|"error";

interface GetRowsParams {
  // The first row index to get. 
  startRow: number;
  // The first row index to NOT get. 
  endRow: number;
  // Callback to call for the result when successful. 
  successCallback(rowsThisBlock: any[], lastRow?: number): void;
  // Callback to call when the request fails. 
  failCallback(): void;
}

type ErrorObject = {
	error: String,
	message: String,
	data?: any
}

type DataSourceOptions = {
	entityType?:string,
	entityId?: string,
	propertyName?: string,
	loader: PageLoaderFunction,
	context? : Object
}