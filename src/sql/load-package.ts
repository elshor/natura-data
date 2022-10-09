/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
/** load a package with sql properties and generate functions */

import datasourceQuery from "./datasource-query";

const expressions = new Map();
type DataExpression = {
	sql : string;
	name : string;
	valueType: string;
}
type DataPackage = {
	expressions : DataExpression[];
}

export function initPackage(pkg : DataPackage){
	(pkg.expressions||[]).forEach(expr=>{
		if(expr.sql){
			const parsedValueType = (expr.valueType ||'').match(/^dataset\<(.+)\>$/);
			if(parsedValueType){
				expressions.set(expr.name,datasourceQuery.bind({
					query:expr.sql,
					type: parsedValueType[1]
				}))
			}
		}
	})
}

export function generateFunction(spec,fn:Function){
	const expr = expressions.get(spec.$type);
	if(expr){
		return function(){
			return expr();
		}
	}else{
		return function(){
			console.error('Error - no function defined for',spec.$type,spec);
		}
	}
}

