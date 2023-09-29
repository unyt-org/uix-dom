import {Document} from "./Document.ts";
import {DocumentFragment} from "./DocumentFragment.ts";
import {Node} from "./Node.ts";
import {Element} from "./Element.ts";
import {HTMLElement} from "./HTMLElement.ts";
import {ShadowRoot} from "./ShadowRoot.ts";
import {Window} from "./Window.ts";

export class DOMContext {
	Document = Document;
	DocumentFragment = DocumentFragment;
	Node = Node;
	Element = Element;
	HTMLElement = HTMLElement;
	ShadowRoot = ShadowRoot;

	window = new Window()
}