import type { DOMContext } from "../dom/DOMContext.ts";
import { JSX_INSERT_STRING, type DOMUtils, appendableContent } from "../datex-bindings/dom-utils.ts";

import { Logger } from "datex-core-legacy/datex_all.ts";
import { getCallerFile, getCallerInfo } from "datex-core-legacy/utils/caller_metadata.ts";
import { Datex } from "datex-core-legacy/mod.ts";
import { client_type } from "datex-core-legacy/utils/constants.ts";


const logger = new Logger("JSX Parser");

export const SET_DEFAULT_ATTRIBUTES: unique symbol = Symbol("SET_DEFAULT_ATTRIBUTES");
export const SET_DEFAULT_CHILDREN: unique symbol = Symbol("SET_DEFAULT_CHILDREN");
export const IS_TEMPLATE: unique symbol = Symbol("IS_TEMPLATE");


export function escapeString(string:string) {
	return {[JSX_INSERT_STRING]:true, val:string};
}

export function getParseJSX(context: DOMContext, domUtils: DOMUtils) {

	function setChildren(element: Element, children: appendableContent|appendableContent[]|appendableContent[][], shadow_root: boolean) {
		// is nested arrays in outer array
		if (children instanceof Array && !Datex.ReactiveValue.isRef(children)) {
			for (const child of children) {
				setChildren(element, child, shadow_root);
			}
		}

		else if (shadow_root) {
			const template = parseJSX("template", {children, shadowrootmode:shadow_root});
			if (domUtils) domUtils.append(element, template);
			else element.append(template)
		}
		else {
			if (domUtils) domUtils.append(element, children as appendableContent|appendableContent[]);
			else element.append(...(children instanceof Array ? children : [children]) as appendableContent[])
		}
	}


	function initElement({element, children, props, shadow_root, set_default_children, set_default_attributes, allow_invalid_attributes, callerModule}: {
		element: Element,
		children: JSX.singleChild[],
		props: { [x: string]: unknown; },
		shadow_root: boolean,
		set_default_children: boolean, 
		set_default_attributes:boolean, 
		allow_invalid_attributes: boolean,
		callerModule?: string
	}) {
		if (set_default_children) setChildren(element, children, shadow_root);

		if (set_default_attributes) {
			let module = ((<Record<string,unknown>>props)['module'] ?? (<Record<string,unknown>>props)['uix-module']) as string|null;
			// ignore module of is explicitly module===null, otherwise fallback to getCallerFile
			// TODO: optimize don't call getCallerFile for each nested jsx element, pass on from parent?
			if (module === undefined) {
				// module already determined
				if (callerModule) module = callerModule;
				// get caller module
				else {
					const stack = getCallerInfo();
					if (stack && stack[1]) {
						module = (
							stack[1].name == "jsxs" ? // called via jsxs, skip one more in stack
								stack[2] : 
								stack[1]
							)?.file;
					}
				}
				if (!module) {
					logger.error("Could not determine location of JSX definition")
				}
			}
			
			for (const [attr,val] of Object.entries(props)) {
				if (attr == "style" && (element as HTMLElement).style) domUtils.setCSS(element as HTMLElement, <any> val);
				else {
					const valid_attr = domUtils.setElementAttribute(element, attr, <any>val, module);
					if (!allow_invalid_attributes && !valid_attr)
						logger.warn(`Attribute "${attr}" is not allowed for <${element.tagName.toLowerCase()}> element. If you believe this is a mistake, please open an issue at https://github.com/unyt-org/uix`);
				}
			}
		}


		// !important, cannot return directly because of stack problems, store in ptr variable first
		if (domUtils) {
			const ptr = domUtils.addProxy(element);
			return ptr;
		}

		else return element;
	}



	function parseJSX(type: string | typeof Element | typeof DocumentFragment | ((...args:unknown[])=>Element|DocumentFragment), params: Record<string,unknown>, isJSXS = false): Element {

		Datex.ReactiveValue.freezeCapturing = true;
		const isTemplate = (type as any)[IS_TEMPLATE] ?? false;
		const isComponent = typeof type == "function" && (context.HTMLElement.isPrototypeOf(type) || type === context.DocumentFragment || context.DocumentFragment.isPrototypeOf(type))

		let element:Element;

		// normalize children if template/blankTemplate or component - not for plain functions
		if (isTemplate || isComponent) {
			// always convert children prop to array
			if ('children' in params && !(params.children instanceof Array)) params.children = [params.children];
			// always set children prop to empty array if not defined
			if (!('children' in params)) params.children = [];
		}
		const { children = [], ...props } = params as Record<string,unknown> & {children:JSX.singleChild[]}
	
		// _debug property to debug jsx
		if (props._debug) {
			delete props._debug;
			console.log(type,children,props,params)
		}

		let set_default_children = true;
		let set_default_attributes = true;
		let allow_invalid_attributes = true;
	
		let shadow_root = false;
		if (props['shadow-root']) {
			shadow_root = props['shadow-root']==true?'open':props['shadow-root'];
			delete props['shadow-root'];
		}

	
		// replace ShadowRoot with shadow-root
		if (type === context.ShadowRoot) type = "shadow-root";
		
		if (typeof type === 'function') {

			// class component
			if (isComponent) {
				set_default_children = (type as any)[SET_DEFAULT_CHILDREN] ?? true;
				set_default_attributes = (type as any)[SET_DEFAULT_ATTRIBUTES] ?? true;
				if (set_default_children) delete params.children;
	
				element = new type(set_default_children ? props : {...props, children}) // uix component
			}
			// function component
			else {
				set_default_children = (type as any)[SET_DEFAULT_CHILDREN];
				set_default_attributes = (type as any)[SET_DEFAULT_ATTRIBUTES];
				if (set_default_children) delete params.children;
	
				element = type(params)

				// async component, use uix-placeholder
				if (element instanceof Promise) {
					const placeholder = document.createElement("uix-placeholder");
					domUtils.addProxy(placeholder);
					const callerModule = getCallerFile();
					(element as Promise<Element>).then(val => {
						placeholder.replaceWith(initElement({
							element: val,
							children,
							props,
							shadow_root, 
							set_default_children, 
							set_default_attributes, 
							allow_invalid_attributes,
							callerModule
						}))
					});
					Datex.ReactiveValue.freezeCapturing = false;
					return placeholder;
				}

			}
		}
	
	
		else {
			allow_invalid_attributes = false;

			// frontend-slots only allowed on the backend
			if (type == "frontend-slot" && client_type !== "deno") {
				throw new Error("<frontend-slot> elements are only allowed on the backend");
			}
			
			// convert shadow-root to template
			if (type == "shadow-root") {
				type = "template"
				props.shadowrootmode = props.mode ?? "open";
				delete props.mode
			}
			
			element = domUtils ? domUtils.createElement(type) : context.document.createElement(type)
		}

		// if (!(element instanceof context.Element || element instanceof context.DocumentFragment)) {
		// 	throw new Error("Invalid JSX element, must be of type Element")
		// }

		const res = initElement({
			element,
			children,
			props,
			shadow_root, 
			set_default_children, 
			set_default_attributes, 
			allow_invalid_attributes
		});
		Datex.ReactiveValue.freezeCapturing = false;
		return res;
		
	}

	return parseJSX;
}