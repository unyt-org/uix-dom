import { HTMLElementTagNameMap } from "./types.ts";
import { HTMLElement } from "./HTMLElement.ts";
import { SVGElement } from "./SVGElement.ts";
import { MathMLElement } from "./MathMLElement.ts";
import { Text } from "./html/Text.ts";

export class Document {

	createElement(tagName: keyof HTMLElementTagNameMap) {
		return new HTMLElement(tagName)
	}

	createElementNS(namespaceURI:string, tagName: string) {
		if (namespaceURI == "http://www.w3.org/2000/svg") return new SVGElement(tagName as any)
		else if (namespaceURI == "http://www.w3.org/1998/Math/MathML") return new MathMLElement(tagName as any)
		else return new HTMLElement(tagName as any)
	}

	createTextNode(text: string) {
		return new Text(text)
	}


}

export const document = new Document();

// // @ts-ignore
// globalThis.document = document;
// declare global {
// 	const document: Document
// }