export interface Unit {
	id: string;
	name: string;
	position: number;
	unitTypeId: string | null;
}
export interface Storey {
	id: string;
	name: string;
	position: number;
	units: Array<Unit>;
}
export interface Block {
	id: string;
	name: string;
	position: number;
	storeys: Array<Storey>;
}
export interface UnitType {
	id: string;
	code: string;
	description: string | null;
	unitCount: number;
}
export interface Project {
	id: string;
	name: string;
	code: string;
	blocks: Array<Block>;
	unitTypes: Array<UnitType>;
}
