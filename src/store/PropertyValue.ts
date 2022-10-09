import "../types/store"

export class PropertyValue {
	value: any;
	status: ValueStatus;
	updated: Date;
	resolver:Function = null;
	rejecter:Function = null;
	constructor(value: any = undefined) {
		this.value = value;
		this.updated = new Date();
	}
	startLoading(){
		const self = this;
		this.status = "loading";
		this.value = new Promise((resolver,rejecter)=>{
			self.resolver = resolver;
			self.rejecter = rejecter;
		});
	}
	update(value: any) {
		this.value = value;
		this.updated = new Date();
		this.status = "complete";
		if(this.resolver){
			this.resolver(value);
			this.resolver = null;
		}
	}
	fail(error:ErrorObject){
		if(this.rejecter){
			this.rejecter(error);
		}
	}
}
