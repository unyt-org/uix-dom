import { Datex } from "datex-core-legacy/mod.ts";
import type { DOMUtils } from "./dom-utils.ts";
import type { DOMContext } from "../dom/DOMContext.ts";
import { allDomTypes } from "./dom-datex-types.ts";

function appendToFragment(domUtils: DOMUtils, context: DOMContext, fragment: HTMLElement, val: any) {
	domUtils.append(fragment, val);
	if (val instanceof context.HTMLElement) {
		if (val.hasAttribute("slot")) fragment.setAttribute("slot", val.getAttribute("slot"))
	}
}

/**
 * JS interface method definitions to create a transform wrapper for DOM elements
 * @param document 
 * @returns 
 */
export function getTransformWrapper(domUtils: DOMUtils, context: DOMContext) {
	return {
		// special uix-fragment wrapper for transforms
		// wrap_transform(val:any) {
		// 	const fragment = context.document.createElement("uix-fragment");
		// 	appendToFragment(domUtils, context, fragment, val);
		// 	return fragment;
		// },
	
		allow_transform_value(type: Datex.Type) {
			return allDomTypes.has(type.root_type) || type.root_type.name == "uix" || "must be a DOM element"
		},
	
		handle_transform(val:any, ptr:Datex.Pointer) {
			const fragment = ptr.val;
			// no content change
			if (fragment.children.length == 1 && [...fragment.children][0] == val) return;
	
			fragment.innerHTML = "";
			appendToFragment(domUtils, context, fragment, val);
		}
	}
}