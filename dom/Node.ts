import { NodeList } from "./NodeList.ts";

export class Node extends EventTarget {
	textContent: string|null = null

	childNodes = NodeList.create()

	constructor(textContent?:string) {
		super();
		if (textContent != null)
			this.textContent = textContent;
	}
}