import { $$, Datex } from "datex-core-legacy";
import { DOMUtils } from "./dom-utils.ts"
import { DX_VALUE, INIT_PROPS, logger } from "datex-core-legacy/datex_all.ts";
import { DX_IGNORE } from "datex-core-legacy/runtime/constants.ts";
import type { DOMContext } from "../dom/DOMContext.ts";
import type { Element, DocumentFragment, MutationObserver, Document, Node, Comment } from "../dom/mod.ts"
import { querySelector } from "../dom/shadow_dom_selector.ts";
import { client_type } from "datex-core-legacy/utils/constants.ts";
import { commentType, documentType, fragmentType, htmlType, mathmlType, svgType } from "./dom-datex-types.ts";
import { getTransformWrapper } from "./transform-wrapper.ts";

let definitionsLoaded = false;

const OBSERVER = Symbol("OBSERVER");
const OBSERVER_EXCLUDE_UPDATES = Symbol("OBSERVER_EXCLUDE_UPDATES");
const OBSERVER_IGNORE = Symbol("OBSERVER_IGNORE");


export type BindingOptions = {
	mapFileURL?: (url: `file://${string}`) => string
}

export function loadDefinitions(context: DOMContext, domUtils: DOMUtils, options?: BindingOptions) {

	// definitions cannot be loaded multiple times
	if (definitionsLoaded) throw new Error("DATEX type binding very already loaded for a window object")
	definitionsLoaded = true;


	// TODO: not functional yet
	function bindObserver(element:Element) {
		const pointer = Datex.Pointer.getByValue(element);
		if (!pointer) throw new Error("cannot bind observers for HTMLElement without pointer")
		if (!element.dataset) {
			console.log(element)
			throw new Error("element has no dataset, todo");
		}
		if (!element.hasAttribute("uix-ptr")) element.setAttribute("uix-ptr", pointer.id);

		// @ts-ignore
		if (element[OBSERVER]) return;
		if (element[OBSERVER_IGNORE]) return;

		// const ptr = Datex.Pointer.getByValue(element);

		// important: no direct references to ptr or element in this handler!!!!
		const handler: MutationCallback = (mutations: MutationRecord[], observer: MutationObserver) => {

			// TODO:
			// // @ts-ignore
			// if (element[OBSERVER_EXCLUDE_UPDATES]) {
			// 	// @ts-ignore
			// 	ptr.excludeEndpointFromUpdates(element[OBSERVER_EXCLUDE_UPDATES])
			// 	// @ts-ignore
			// 	element[OBSERVER_EXCLUDE_UPDATES] = undefined;
			// }

			for (const mut of mutations) {
				if (mut.type == "attributes") {
					if (mut.attributeName == "uix-ptr") continue;
					// TODO find style changes, don't send full style attribute
					// ptr.handleSetObservers(mut.attributeName)
				}
				else if (mut.type == "childList") {
					console.log("mut")//,mut, mut.addedNodes, mut.removedNodes)
				}
			}

			//ptr.enableUpdatesForAll();
			
		}

		// @ts-ignore
		element[OBSERVER] = new context.MutationObserver(handler)

		return element;
	}

	const transformWrapper = getTransformWrapper(domUtils, context)

	// handle htmlfragment (DocumentFragment)
	fragmentType.setJSInterface({
		class: context.DocumentFragment,

		...transformWrapper,

		create_proxy(value, pointer) {
			return value;
		},

		// called when replicating from state
		cast_no_tuple(val) {
			const fragment = new context.DocumentFragment();
			for (const child of val) {
				domUtils.append(fragment, child);
			}
			return fragment;
		},

		serialize(val:DocumentFragment) {
			return serializeChildren(val)
		}
	})

	// handle htmlfragment (Document)
	documentType.setJSInterface({
		class: context.Document,

		create_proxy(value, pointer) {
			return value;
		},

		// called when replicating from state
		cast_no_tuple(val) {
			const document = new context.Document();
			for (const child of val) {
				document.appendChild(child);
			}
			return document;
		},

		serialize(val:Document) {
			return serializeChildren(val)
		}
	})

	// handle htmlfragment (Document)
	commentType.setJSInterface({
		class: context.Comment,

		...transformWrapper,

		create_proxy(value, pointer) {
			return value;
		},

		// called when replicating from state
		cast_no_tuple(val) {
			return new context.Comment(val);;
		},

		serialize(val:Comment) {
			return val.textContent;
		}
	})

	function serializeChildren(parent:Element|DocumentFragment|Document) {
		// children
		const children = [];
		for (let i = 0; i < parent.childNodes.length; i++) {
			const child = parent.childNodes[i];
			if (child instanceof context.Text) children.push(child[DX_VALUE] ?? child.textContent);
			else children.push(child);
		}
		return children;
	}

	function getExistingElement(ptrId?: string) {
		if (!ptrId) return;
		if (client_type == "browser") {
			const existingElement = querySelector(`[uix-ptr="${ptrId}"]`) as Element;
			existingElement?.removeAttribute("uix-static");
			existingElement?.removeAttribute("uix-dry");
			existingElement?.setAttribute("uix-hydrated", "");
			return existingElement;
		}
	}

	/**
	 * Replaces existing children of an element with new children.
	 * If there are no lazy children, everything is replaced immediately.
	 * Otherwise the replacement happens asynchronously.
	 */
	function replaceChildrenInOrder(parent: Element | DocumentFragment, currentChildNodes: Node[], newChildren: any[], i = 0) {


		// end of new children reached
		if (i >= newChildren.length) {
			return;
		}

		let currentChild:any = currentChildNodes[i];
		if (currentChild instanceof context.Text) currentChild = currentChild.textContent;
		const child = newChildren[i];

		// child does no exist, just append
		if (currentChild === undefined) {
			domUtils.append(parent, child);
			replaceChildrenInOrder(parent, currentChildNodes, newChildren, i+1);
		}
		// different child, replace
		else if (child !== currentChild) {
			const result = domUtils.replaceWith(currentChildNodes[i], child, true);
			// only continue with next child when replacement is done
			if (result instanceof Promise) 
				result.then(() => replaceChildrenInOrder(parent, currentChildNodes, newChildren, i+1))
			// otherwise continue immediately
			else replaceChildrenInOrder(parent, currentChildNodes, newChildren, i+1);
		}
		// same child, ignore
		else {
			replaceChildrenInOrder(parent, currentChildNodes, newChildren, i+1);
		}
	}

	// handles html/x and also casts from uix/x



	const elementInterface:Datex.js_interface_configuration & {_name:string} = {
		_name: "unset",

		get_type(val) {
			if (val instanceof this.class!) return Datex.Type.get('std', this._name, val.tagName.toLowerCase());
			else throw "not an " + this.class!.name;
		},

		// enable <uix-fragment> wrapping
		...transformWrapper,

		// called when replicating from state
		cast_no_tuple(val, type, _ctx, _origin, assigningPtrId) {

			// merge with existing element in DOM
			const existingElement = getExistingElement(assigningPtrId)

			const isComponent = type.name == "uix";
			if (!isComponent && !type.variation) throw new Error("cannot create "+this.class!.name+" without concrete type")
			
			const propertyInitializer = isComponent ? type.getPropertyInitializer(val?.p ?? {}) : null;
			// create HTMLElement / UIX component
			const el = existingElement ?? (
				isComponent ?
				type.newJSInstance(false) :  // call js constructor, but don't handle as constructor in lifecycle, propertyInitializer is always called afterwards
				domUtils.createElement(type.variation) // create normal Element, no UIX lifecycle
			);

			// set attrs, style, content from object
			if (typeof val == "object" && Object.getPrototypeOf(val) === Object.prototype) {
				
				// sort entries: content, attr, style
				const order = ["content", "attr", "style"];
				const entries = Object.entries(val).sort(([name]) => order.indexOf(name));
				
				for (const [prop,value] of entries) {
					if (prop=="style" && typeof value != "string") {
						for (const [prop, val] of Object.entries(value)) {
							el.style[prop] = val;
						}
					}
					else if (prop=="attr") {
						for (const [prop, val] of Object.entries(value)) {
							domUtils.setElementAttribute(el, prop, val);
						}
					}
					else if (prop=="content") {
						// only update new content (lazy hydration)
						if (existingElement) {
							const currentChildNodes = [...existingElement.childNodes as Iterable<Node>];

							// skip overriding content for frontend slot (TODO: better solution?)
							if (el.tagName.toLowerCase() == "frontend-slot") {
								continue;
							}

							replaceChildrenInOrder(el, currentChildNodes, value instanceof Array ? value : [value])
						}
						// append content
						else {
							for (const child of (value instanceof Array ? value : [value])) {
								domUtils.append(el, child);
							}
						}
					}
					else if (prop=="shadowroot") {
						const shadowRoot = el.attachShadow({mode:"open"});
						shadowRoot.append(value);
					}
				}
			}

			// set direct content when cast from different value
			else {
				domUtils.append(el, val);
			}

			
			// uix component
			if (isComponent) {
				// set 'p' properties (contains options, other properties)
				propertyInitializer![INIT_PROPS](el);
				// trigger UIX lifecycle (onReplicate)
				type.construct(el, undefined, false, true);
			}
			
			return el;
		},

		serialize(val: Element&{[DOMUtils.EVENT_LISTENERS]?:Map<keyof HTMLElementEventMap, Set<[Function, boolean]>>}) {
			if (!(val instanceof this.class!)) throw "not an " + this.class!.name;
			const data: {style:Record<string,string>, content:any[], attr:Record<string,unknown>, shadowroot?:DocumentFragment} = {style: {}, attr: {}, content: []}

			// attributes
			for (let i = 0; i < val.attributes.length; i++) {
				const attrib = val.attributes[i];
				const value = attrib.value;
				// relative web path (@...)
				if (options?.mapFileURL && value.startsWith("file://")) data.attr[attrib.name] = options.mapFileURL(value as `file://${string}`);
				// default attr, ignore style + uix-ptr
				else if (attrib.name !== "style" && attrib.name !== "uix-ptr") data.attr[attrib.name] = value;
				
				// blob -> data url TODO: handle (async blob to base64)
				if (value.startsWith("blob:")) {
					logger.warn("todo: blob url attribute serialization")
					// val = await blobToBase64(val);
				}
			}

			// special attr bindings (value, checked)
			for (const [attr, ref] of (<DOMUtils.elWithUIXAttributes><unknown>val)[DOMUtils.PSEUDO_ATTR_BINDINGS]??[]) {
				data.attr[attr] = ref;
			}

			// event handler attributes
			for (const [name, handlers] of val[DOMUtils.EVENT_LISTENERS]??[]) {
				const allowedHandlers = [];
				for (const [handler] of handlers) {
					allowedHandlers.push($$(handler))
				}
				data.attr['on'+String(name)] = allowedHandlers;
			}

			// style (uix _original_style)
			// @ts-ignore 
			const style = val.style;
			
			let style_props = (style?._importants ? [...Object.keys(style._importants)] : style) ?? [];
			if (style_props && !(style_props instanceof Array || (context.CSSStyleDeclaration && style_props instanceof context.CSSStyleDeclaration))) style_props = [...Object.keys(style_props)];

			if (style_props instanceof Array || style_props instanceof context.CSSStyleDeclaration) {
				for (let prop of style_props) {
					let val = style_props[prop];
					// no value, try to find a matching property: background-color -> background
					if (!val) {
						prop = prop.split("-")[0]
						val = style_props[prop];
						if (!val) logger.warn("style property has no value",prop)
					}
					data.style[prop] = val;
				}
			}
			
			// children
			data.content = serializeChildren(val);

			// shadowroot
			if (val.shadowRoot && !(<any>val.shadowRoot)[DX_IGNORE]) {
				data.shadowroot = val.shadowRoot;
			}

			// logger.info("serialize",data)

			// optimize serialization
			if (Object.keys(data.style).length == 0) delete data.style;
			if (Object.keys(data.attr).length == 0) delete data.attr;
			if (Object.keys(data.content).length == 0) delete data.content;

			if (data.content?.length == 1) {
				data.content = data.content[0];
			}

			return data;
		},

		get_property(parent, key) {
			return parent.getAttribute(key);
		},

		set_property_silently(parent, key, value) {
			parent[OBSERVER_IGNORE] = true; // ignore next observer event
			parent.setAttribute(key, value);
		},

		set_property(parent, key, value, exclude) {
			// has ptr (+ MutationObserver) - tell MutationObserver which endpoint to ignore when triggered for this update
			const ptr = Datex.Pointer.getByValue(parent);
			// @ts-ignore
			if (ptr && exclude) parent[OBSERVER_EXCLUDE_UPDATES] = exclude;
			parent.setAttribute(key, value);
		},

		create_proxy(val, pointer) {
			if (!val.hasAttribute("uix-ptr")) val.setAttribute("uix-ptr", pointer.id);
			// TODO: (handled separately for components)
			// bindObserver(val);
			return val;
		}

	}

	htmlType.setJSInterface(Object.assign(Object.create(elementInterface), {
		_name: 'html',
		class: context.HTMLElement
	}))

	svgType.setJSInterface(Object.assign(Object.create(elementInterface), {
		_name: 'svg',
		class: context.SVGElement
	}))

	mathmlType.setJSInterface(Object.assign(Object.create(elementInterface), {
		_name: 'mathml',
	    class: context.MathMLElement
	}))


	return {
		bindObserver
	}
}