import { Element } from "./Element.ts";
import { SVGElementTagNameMap } from "./types.ts";

export class SVGElement extends Element {
	constructor(tagName: keyof SVGElementTagNameMap) {
		super("http://www.w3.org/2000/svg", tagName);
	}
}