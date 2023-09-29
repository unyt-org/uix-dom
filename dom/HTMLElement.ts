import { CSSStyleDeclaration } from "./CSSStyleDeclaration.ts";
import { Element } from "./Element.ts";
import { HTMLElementTagNameMap } from "./types.ts";

export class HTMLElement extends Element {

	constructor(tagName: keyof HTMLElementTagNameMap) {
		super("http://www.w3.org/1999/xhtml", tagName);
	}

	style = CSSStyleDeclaration.create()

	dataset = {}
}