/*
 *   Copyright (c) 2022 DSAS Holdings LTD.
 *   All rights reserved.
 */
import {initPackage, generateFunction} from './load-package'
export {initPackage}

export function sqlQuery(def,fn){
	const generated = generateFunction(def,fn)
	return generated;
}
