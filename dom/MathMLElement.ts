import { Element } from "./Element.ts";
import { MathMLElementTagNameMap } from "./types.ts";

export class MathMLElement extends Element {
	constructor(tagName: keyof MathMLElementTagNameMap) {
		super("http://www.w3.org/1998/Math/MathML", tagName);
	}
}