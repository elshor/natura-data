/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
import Datasource from './datasource'

export default async function(datasource: Datasource, startRow:number, endRow:number){
	return new Promise((resolve,reject)=>{
		const ret = [];
		loadRows(resolve,reject,datasource,startRow,endRow,ret)
	});
}

function loadRows(resolve:Function, reject:Function,datasource:Datasource, startRow: number, endRow: number,rows: Array<any>){
	const options = {
		startRow,
		endRow,
		successCallback: function(block : Array<any>,count : number){
			block.forEach(row=>rows.push(row));
			const nextRow = rows.length + startRow;
			if(nextRow >= endRow){
				//we loaded all rows we needed
				resolve(rows);
				return;
			}
			if(typeof count === 'number' && count >= 0  && count <= nextRow){
				//no more rows to load
				resolve(rows);
				return;
			}
			//load more rows
			loadRows(resolve,reject,datasource,nextRow,endRow,rows);
		},
		failCallback(error: any){
			reject(error || 'There was an error loading the datasource rows');
		}
	};
	datasource.getRows(options);
}