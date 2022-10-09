/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
import { Datasource } from "../store";
import PageLoader from './page-loader'

type DatasourceQueryThis = {
	query : string;
	type : string;
}

export default function(){
	const data : DatasourceQueryThis = this;
	const ds = new Datasource({loader: PageLoader.bind(data)})
	return ds;
}