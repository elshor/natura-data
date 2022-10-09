import '../types/store'

export class ListPropertyValue {
	valueList: Array<any> = [];
	isListValue : boolean = true;
	updated: Date;
	state: Object = {};
	status: ValueStatus;
	constructor(valueList: Array<any> = [], firstValuePos: number = 0, state: Object = {}) {
		this.update(valueList, firstValuePos, state);
	}
	update(valueList: Array<any>, firstValuePos: number, state: Object = {}) {
		valueList.forEach((value, index) => this.valueList[index + firstValuePos] = value
		);
		this.state = Object.assign(this.state, state);
	}
	setStatus(status: ValueStatus){
		this.status = status;
	}
}
