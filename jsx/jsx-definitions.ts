import type { Datex } from "datex-core-legacy/datex.ts";
import type { validHTMLElementAttrs, validHTMLElementSpecificAttrs, validSVGElementSpecificAttrs } from "../attributes.ts";
import type { HTMLElement, DocumentFragment } from "../dom/mod.ts";
import { HTMLElementTagNameMap, SVGElementTagNameMap } from "../dom/deno-dom/src/dom/types/tags.ts";

type DomElement = HTMLElement // TODO: Element?


type RefOrValueUnion<U> = (U extends any ? Datex.RefOrValue<U> : never)

declare global {
	namespace JSX {
		// JSX node definition
		type Element = DomElement|DocumentFragment
		type ElementType = string|{new(): Element}|((props?:any, propsValues?:any)=>Element)|((props?:any, propsValues?:any)=>Promise<Element>)

		// type ElementClass = typeof Element

		type Fragment = DocumentFragment;

		// Property that will hold the HTML attributes of the Component
		interface ElementAttributesProperty {
			props: Record<string,unknown>
		}

		// Property in 'props' that will hold the children of the Component
		interface ElementChildrenAttribute {
			children: HTMLElement[]|HTMLElement
		}

		type singleChild = Datex.RefOrValue<Element>|Datex.RefOrValue<DocumentFragment>|Datex.RefOrValue<string>|Datex.RefOrValue<number>|Datex.RefOrValue<boolean>|Datex.RefOrValue<bigint>|Datex.RefOrValue<null>|Datex.RefOrValue<undefined>;
		type singleOrMultipleChildren = singleChild|singleChild[]|Map<number, singleChild>;
		type childrenOrChildrenPromise = singleOrMultipleChildren|Promise<singleOrMultipleChildren>|Datex.Pointer<Element[]>
		// enable as workaround to allow {...[elements]} type checking to work correctly
		// type childrenOrChildrenPromise = _childrenOrChildrenPromise|_childrenOrChildrenPromise[]

		type htmlAttrs<T extends Record<string,unknown>, allowPromises extends boolean = false> = Partial<DatexValueObject<Omit<T, 'children'|'style'|'class'>, allowPromises>>

		// Common attributes of the standard HTML elements and JSX components
		// using _IntrinsicAttributes (not IntrinsicAttributes) to prevent jsx default type behaviour
		type _IntrinsicAttributes<El extends HTMLElement = HTMLElement> = {
			style?: Datex.RefOrValue<string|{[key: string]: Datex.RefOrValue<string>|Datex.RefOrValue<number>|Datex.RefOrValue<boolean>}>,
			class?: Datex.RefOrValue<string|{[key: string]: Datex.RefOrValue<boolean>}>,
		} & htmlAttrs<validHTMLElementAttrs<El>>

		// TODO: enable for UIX - Common attributes of the UIX components only
		// interface IntrinsicClassAttributes<C extends Component> {}

		type DatexValueObject<T extends Record<string|symbol,unknown>, allowPromises extends boolean = false> = {
			[key in keyof T]: T[key] extends (...args:unknown[])=>unknown ? T[key] : (T[key] extends boolean ? Datex.RefOrValue<T[key]> : RefOrValueUnion<T[key]>)|(allowPromises extends true ? Promise<(T[key] extends boolean ? Datex.RefOrValue<T[key]> : RefOrValueUnion<T[key]>)> : never)
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
				'shadow-root': {children?: childrenOrChildrenPromise|childrenOrChildrenPromise[]} & {mode?:'open'|'closed'}
				'light-root': {children?: childrenOrChildrenPromise|childrenOrChildrenPromise[]}
				'uix-fragment': {children?: childrenOrChildrenPromise|childrenOrChildrenPromise[]}
				'frontend-slot': {children?: childrenOrChildrenPromise|childrenOrChildrenPromise[]} & {name?:string}
			}
	}
}