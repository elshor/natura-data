/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
import {PageLoaderOptions} from 'natura-data'
import { BigQuery, Job } from "@google-cloud/bigquery";

type PageLoaderThis = {
	/** query job - if created */
	job? : Job;
	/** sql query */
	query : string;
	/** natura type of returned ids */
	type: string;
}
type QueryCallbackThis = {
	loaderThis : PageLoaderThis;
	loaderOptions: PageLoaderOptions;
}

/**
 * load paged response from sql database
 * @param options 
 */
export default async function pageLoader(options: PageLoaderOptions){
	if(!this.job){
		const ret = await new BigQuery().createQueryJob(this.query)
		this.job = ret[0];
	}
	this.job.getQueryResults({
		autoPaginate:false,
	},queryRowsCallback.bind({loaderOptions:options, loaderThis:this}))
}

function queryRowsCallback(err,rows,nextQuery,apiResponse){
	const {loaderThis, loaderOptions} = this;

	if(err){
		return loaderOptions.onFail(err)
	}
}