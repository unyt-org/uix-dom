import { Node } from "./Node.ts";

export class Element extends Node {
	#tagName: string
	get tagName() {return this.#tagName}

	#namespaceURI: string
	get namespaceURI() {return this.#tagName}

	constructor(namespaceURI:string, tagName: string) {
		super();
		this.#namespaceURI = namespaceURI;
		this.#tagName = tagName;
	}
}