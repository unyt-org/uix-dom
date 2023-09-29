import {Document} from "./Document.ts";
import {DocumentFragment} from "./DocumentFragment.ts";
import {Node} from "./Node.ts";
import {Element} from "./Element.ts";
import {HTMLElement} from "./HTMLElement.ts";
import {SVGElement} from "./SVGElement.ts";
import {ShadowRoot} from "./ShadowRoot.ts";
import {Window} from "./Window.ts";
import { HTMLVideoElement } from "./html/HTMLVideoElement.ts";
import { HTMLFormElement } from "./html/HTMLFormElement.ts";
import { HTMLTemplateElement } from "./html/HTMLTemplateElement.ts";
import { MutationObserver } from "./MutationObserver.ts";
import { Text } from "./html/Text.ts";

export class DOMContext {
	Document = Document;
	DocumentFragment = DocumentFragment;
	Node = Node;
	Element = Element;
	HTMLElement = HTMLElement;
	ShadowRoot = ShadowRoot;
	SVGElement = SVGElement;
	
	HTMLVideoElement = HTMLVideoElement
	HTMLFormElement = HTMLFormElement
	HTMLTemplateElement = HTMLTemplateElement
	
	Text = Text

	MutationObserver = MutationObserver

	window = new Window()
}