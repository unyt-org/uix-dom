import type { Datex } from "datex-core-legacy/datex.ts";
import type { validHTMLElementAttrs, validHTMLElementSpecificAttrs, validSVGElementSpecificAttrs } from "../attributes.ts";
import type { Element, DocumentFragment } from "../dom/mod.ts";
import { HTMLElementTagNameMap, SVGElementTagNameMap } from "../dom/deno-dom/src/dom/types/tags.ts";

type DomElement = Element

declare global {
	namespace JSX {
		// JSX node definition
		type Element = DomElement

		// type ElementClass = typeof Element

		type Fragment = DocumentFragment;

		// Property that will hold the HTML attributes of the Component
		interface ElementAttributesProperty {
			props: Record<string,unknown>
		}

		// Property in 'props' that will hold the children of the Component
		interface ElementChildrenAttribute {
			children: Element[]|Element
		}

		type singleChild = Datex.RefOrValue<Element|DocumentFragment|string|number|boolean|bigint|null|undefined>;
		type singleOrMultipleChildren = singleChild|singleChild[]|Map<number, singleChild>;
		type childrenOrChildrenPromise = singleOrMultipleChildren|Promise<singleOrMultipleChildren>
		// enable as workaround to allow {...[elements]} type checking to work correctly
		// type childrenOrChildrenPromise = _childrenOrChildrenPromise|_childrenOrChildrenPromise[]

		type htmlAttrs<T extends Record<string,unknown>, allowPromises extends boolean = false> = DatexValueObject<Omit<Partial<T>, 'children'|'style'>, allowPromises>

		// Common attributes of the standard HTML elements and JSX components
		// using _IntrinsicAttributes (not IntrinsicAttributes) to prevent jsx default type behaviour
		type _IntrinsicAttributes<El extends HTMLElement = HTMLElement> = {
			style?: Datex.RefOrValue<string|Record<string,Datex.RefOrValue<string|number|undefined>>>,
		} & htmlAttrs<validHTMLElementAttrs<El>>

		// TODO: enable for UIX - Common attributes of the UIX components only
		// interface IntrinsicClassAttributes<C extends Component> {}

		type DatexValueObject<T extends Record<string|symbol,unknown>, allowPromises extends boolean = false> = {
			[key in keyof T]: T[key] extends (...args:unknown[])=>unknown ? T[key] : Datex.RefOrValue<T[key]>|(allowPromises extends true ? Promise<Datex.RefOrValue<T[key]>> : never)
		}
		
		type IntrinsicElements = 
		// html elements
		{
			readonly [key in keyof HTMLElementTagNameMap]: _IntrinsicAttributes<HTMLElementTagNameMap[key]> & {children?: childrenOrChildrenPromise|childrenOrChildrenPromise[]} & htmlAttrs<validHTMLElementSpecificAttrs<key>, true>
		} 
		// svg elements
		& {
			readonly [key in keyof SVGElementTagNameMap]: _IntrinsicAttributes<HTMLElementTagNameMap[key]> & {children?: childrenOrChildrenPromise|childrenOrChildrenPromise[]} & htmlAttrs<validSVGElementSpecificAttrs<key>, true>
		} 
		// other custom elements
		& {
			'shadow-root': {children?: childrenOrChildrenPromise|childrenOrChildrenPromise[]} & {[key in keyof _IntrinsicAttributes]: never} & {mode?:'open'|'closed'}
			'light-root': {children?: childrenOrChildrenPromise|childrenOrChildrenPromise[]} & {[key in keyof _IntrinsicAttributes]: never}
		}
	}
}