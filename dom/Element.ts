import { Attr } from "./Attr.ts";
import { NamedNodeMap } from "./NamedNodeMap.ts";
import { Node } from "./Node.ts";
import { DOM_INTERNAL } from "./constants.ts";
import { Text } from "./html/Text.ts";

export class Element extends Node {
	#tagName: string
	get tagName() {return this.#tagName}

	#namespaceURI: string
	get namespaceURI() {return this.#tagName}

	#attributes = NamedNodeMap.create()

	get attributes() {return this.#attributes}

	constructor(namespaceURI:string, tagName: string) {
		super();
		this.#namespaceURI = namespaceURI;
		this.#tagName = tagName;
	}


	setAttribute(name: string, value: string) {
		this.#attributes.setNamedItem(name, new Attr(name, String(value), undefined, undefined, this))
	}

	getAttribute(name: string) {
		this.#attributes.get(name)
	}

	removeAttribute(name: string) {
		this.#attributes.delete(name)
	}

	append(...nodes:(Node|string)[]) {
		this.childNodes[DOM_INTERNAL].append(...nodes.map(node => typeof node == "string" ? new Text(node) : node))
	}
}