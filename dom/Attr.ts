import { Element } from "./Element.ts";

export class Attr {

	get specified() {return true}

	#ownerElement:Element
	get ownerElement() {return this.#ownerElement}

	#localName: string
	get localName() {return this.#localName}

	#prefix: string|null
	get prefix() {return this.#prefix}

	#namespaceURI: string|null
	get namespaceURI() {return this.#namespaceURI}

	get name() {return (this.#prefix ? this.#prefix+':': '') + this.#localName}

	value: string

	constructor(localName: string, value: string, namespaceURI:string|null = null, prefix:string|null = null, ownerElement:Element) {
		this.#localName = localName;
		this.#ownerElement = ownerElement;
		this.value = value;
		this.#namespaceURI = namespaceURI;
		this.#prefix = prefix;
	}

}