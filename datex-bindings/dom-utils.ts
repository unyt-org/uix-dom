import { Datex } from "datex-core-legacy"
import { defaultElementAttributes, elementEventHandlerAttributes, htmlElementAttributes, mathMLTags, svgElementAttributes, svgElementAttributesLowercase, svgTags } from "../attributes.ts";

import { IterableHandler } from "datex-core-legacy/utils/iterable-handler.ts";
import { DX_VALUE, DX_REPLACE, PointerProperty } from "datex-core-legacy/datex_all.ts";
import type { DOMContext } from "../dom/DOMContext.ts";
import { JSTransferableFunction } from "datex-core-legacy/types/js-function.ts";
import { client_type } from "datex-core-legacy/utils/constants.ts";
import { weakAction } from "datex-core-legacy/utils/weak-action.ts";
import { LazyPointer } from "datex-core-legacy/runtime/lazy-pointer.ts";
import { isolatedScope } from "datex-core-legacy/utils/isolated-scope.ts";
import { Time } from "datex-core-legacy/types/time.ts";
export const JSX_INSERT_STRING: unique symbol = Symbol("JSX_INSERT_STRING");


const logger = new Datex.Logger("UIX");

type appendableContentBase = Datex.RefOrValue<Element|DocumentFragment|string|number|bigint|boolean>|Promise<appendableContent>;
export type appendableContent = appendableContentBase|Promise<appendableContentBase>


// deno-lint-ignore no-namespace
export namespace DOMUtils {
    export type elWithUIXAttributes = Element & {
        [DOMUtils.EVENT_LISTENERS]:Map<keyof HTMLElementEventMap, Set<[(...args:any)=>any, boolean]>>
        [DOMUtils.ATTR_BINDINGS]:Map<string, Datex.ReactiveValue>,
        [DOMUtils.ATTR_DX_VALUES]:Map<string, Datex.ReactiveValue>,
        [DOMUtils.STYLE_DX_VALUES]:Map<string, Datex.ReactiveValue<string>>,
        [DOMUtils.STYLE_WEAK_PROPS]:Map<string, boolean>,
        [DOMUtils.CHILDREN_DX_VALUES]:Set<Datex.ReactiveValue>,        
        [DOMUtils.DATEX_UPDATE_TYPE]?: string,
        [DOMUtils.ATTR_SELECTED_BINDING]?: Datex.ReactiveValue
    }
}

type InputValidation = {
    message: Datex.RefOrValue<string>,
    enabled: boolean
}

export class DOMUtils {

    static readonly EVENT_LISTENERS: unique symbol = Symbol.for("DOMUtils.EVENT_LISTENERS");
    static readonly ATTR_BINDINGS: unique symbol = Symbol.for("DOMUtils.ATTR_BINDINGS");
    static readonly ATTR_DX_VALUES: unique symbol = Symbol.for("DOMUtils.ATTR_DX_VALUES");
    static readonly STYLE_DX_VALUES: unique symbol = Symbol.for("DOMUtils.STYLE_DX_VALUES");
    static readonly STYLE_WEAK_PROPS: unique symbol = Symbol.for("DOMUtils.STYLE_WEAK_PROPS");
    static readonly CHILDREN_DX_VALUES: unique symbol = Symbol.for("DOMUtils.CHILDREN_DX_VALUES");
    static readonly ATTR_SELECTED_BINDING: unique symbol = Symbol.for("DOMUtils.ATTR_SELECTED_BINDING");

    static readonly DATEX_UPDATE_TYPE: unique symbol = Symbol.for("DOMUtils.DATEX_UPDATE_TYPE");
    static readonly PLACEHOLDER_CONTENT: unique symbol = Symbol.for("DOMUtils.PLACEHOLDER_CONTENT");

    readonly svgNS = "http://www.w3.org/2000/svg"
	readonly mathMLNS = "http://www.w3.org/1998/Math/MathML"
	
	constructor(public readonly context: DOMContext) {}
    get document() {return this.context.document}


    /**
     * Global settings for input validation.
     * Per default, input values bound to number references are validated.
     * Input validation for specific types can be disabled by setting the 'enabled' property to false,
     * and custom validation messages can be set.
     */
    public defaultInputValidation: Record<'number'|'bigint', InputValidation> = {
        'number': {
            message: "Invalid number",
            enabled: true,
        },
        'bigint': {
            message: "Invalid integer",
            enabled: true,
        }
    }

	escapeHtml(str:string) {
        if (typeof str != "string") return "";
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replaceAll('"', '&quot;').replaceAll("'", '&#039;').replace('\u0009', '&#9;')
    }


    createHTMLElement(html?:string, content?:Datex.RefOrValue<HTMLElement>|(Datex.RefOrValue<HTMLElement>)[]):HTMLElement {
        if (html == undefined) html = "<div></div>";
        const template = this.document.createElement('template');
        html = html.trim();
        template.innerHTML = html;
        const element = <HTMLElement>template.content.firstChild;

        if (content != undefined) {
            // set html
            if (Datex.ReactiveValue.collapseValue(content,true,true) instanceof this.context.HTMLElement) this.setElementHTML(element, <HTMLElement>content);
            // set child nodes
            if (content instanceof Array) {
                for (const el of content){
                    if (Datex.ReactiveValue.collapseValue(el,true,true) instanceof this.context.HTMLElement) element.append(Datex.ReactiveValue.collapseValue(el,true,true))
                    else {
                        const container = this.document.createElement("div");
                        this.setElementText(container, el);
                        element.append(container);
                    }
                }
            }
            // set text
            else this.setElementText(element, content);
        }
        return element;
    }

    // remember which values are currently synced with element content - for unobserve
    private element_bound_html_values = new WeakMap<Element, Datex.Value>();
    private element_bound_text_values = new WeakMap<Element, Datex.Value>();

    private updateElementHTML = function (this:Element, html:Element|string){
        if (html instanceof Element) {
            this.innerHTML = '';
            this.append(html)
        } 
        else this.innerHTML = html ?? '';
    }

    private updateElementText = function (this:HTMLElement, text:unknown){
        if (this instanceof Datex.ReactiveValue) console.warn("update text invalid", this, text)
        
        if (text instanceof Datex.Markdown) {
            this.innerHTML = (text.getHTML() as HTMLElement).children[0].innerHTML;
        }
        // @ts-ignore _use_markdown
        else if (this._use_markdown && typeof text == "string") {
            this.innerHTML = (new Datex.Markdown(text).getHTML() as HTMLElement).children[0].innerHTML;
        }
        else this.innerText = ((<any>text)?.toString()) ?? ''
    }

    setElementHTML<T extends Element>(element:T, html:Datex.RefOrValue<string|boolean|Element>):T {
        // unobserve?
        this.element_bound_html_values.get(element)?.unobserve(element);
        this.element_bound_text_values.get(element)?.unobserve(element);

        // none
        if (html == undefined || html === false) element.innerHTML = '';

        // DatexValue
        if (html instanceof Datex.ReactiveValue) {
            this.updateElementHTML.call(element, html.val);

            // @ts-ignore: TODO: fix?
            html.observe(this.updateElementHTML, element);
            this.element_bound_html_values.set(element, html);
        }
        // default
        else this.updateElementHTML.call(element, html);

        return element;
    }

    setElementText<T extends HTMLElement>(element:T, text:Datex.RefOrValue<unknown>, markdown = false):T{
        // unobserve?
        this.element_bound_html_values.get(element)?.unobserve(element);
        this.element_bound_text_values.get(element)?.unobserve(element);

        // @ts-ignore markdown flag
        element._use_markdown = markdown;

        // none
        if (text == undefined || text === false) element.innerText = '';

        // Datexv Ref
        else if (text instanceof Datex.ReactiveValue) {
            
            this.updateElementText.call(element, text.val);

            text.observe(this.updateElementText, element);
            this.element_bound_text_values.set(element, text);
        }
        // default
        else this.updateElementText.call(element, text);

        return element;
    }


	createElement(tagName:string): SVGElement|MathMLElement|HTMLElement {
		if (svgTags.has(tagName as any)) return this.document.createElementNS(this.svgNS, tagName as any) as SVGElement;
		else if (mathMLTags.has(tagName as any)) return this.document.createElementNS(this.mathMLNS, tagName as any) as MathMLElement;
		else return this.document.createElement(tagName as any) as HTMLElement;
	}


    /**
     * Append children to a parent, updates children dynamically if pointer of iterable provided
     * @param parent 
     * @param children 
     * @returns 
     */
    append<T extends Element|DocumentFragment>(parent:T, children:appendableContent|appendableContent[]):T | undefined {

        // @ts-ignore extract children ref iterable from DocumentFragment
        if (children instanceof this.context.DocumentFragment && children._uix_children) children = children._uix_children;

        const collapsedChildren = Datex.ReactiveValue.collapseValue(children);

        // is ref and iterable/element
        if (!(parent instanceof this.context.DocumentFragment) && Datex.ReactiveValue.isRef(children) && (collapsedChildren instanceof Array || collapsedChildren instanceof Map || collapsedChildren instanceof Set)) {
            // is iterable ref
            // TODO: support promises
            children = collapsedChildren;

            const ref:Datex.ReactiveValue = children instanceof Datex.ReactiveValue ? children : Datex.Pointer.getByValue(children)!;

            if (!(<DOMUtils.elWithUIXAttributes><unknown>parent)[DOMUtils.CHILDREN_DX_VALUES]) 
                (<DOMUtils.elWithUIXAttributes><unknown>parent)[DOMUtils.CHILDREN_DX_VALUES] = new Set<Datex.ReactiveValue>();
            (<DOMUtils.elWithUIXAttributes><unknown>parent)[DOMUtils.CHILDREN_DX_VALUES].add(ref)

            const startAnchor = new this.context.Comment("start " + Datex.Pointer.getByValue(children)?.idString())
            const endAnchor = new this.context.Comment("end " + Datex.Pointer.getByValue(children)?.idString())
            parent.append(startAnchor, endAnchor)

            const Comment = this.context.Comment;

            const iterableHandler = new IterableHandler<appendableContent, Node>(children as appendableContent[], {
                map: (v,k) => {
                    const {node: el} = this.valueToDOMNode(v);
                    return el;
                },
                onEntryRemoved: (v,k) => {
                    // remove kth child
                    const node = parent.childNodes[k+1];
                    // out of bounds
                    if (!node || node === endAnchor || node === startAnchor){
                        return;
                    }
                    node.remove();
                },
                onNewEntry(v,k,p)  {
                    // if kth child exists, replace, otherwise append at end
                    const current = parent.childNodes[k+1];
                    if (current && current != endAnchor) parent.replaceChild(v, current);
                    else {
                        // fill gap if k is larger than current children
                        if (k > parent.childNodes.length-2) {
                            for (let i = parent.childNodes.length-2; i < k; i++) {
                                parent.insertBefore(new Comment("empty"), endAnchor);
                            }
                        }
                        parent.insertBefore(v, endAnchor);
                    }
                },
                onEmpty: () => {
                    let current:Node|null|undefined = startAnchor.nextSibling;
                    while (current && current !== endAnchor) {
                        const removing = current;
                        current = current?.nextSibling
                        parent.removeChild(removing);
                    }
                }
            })

            // workaround: prevent iterableHandler GC 
            parent[Datex.Pointer.DISPOSABLES] = iterableHandler

            // TODO: element references updating required?
            // else if (children instanceof Element) {
            //     const scheduler = new TaskScheduler(true);
            //     let lastChildren: Node[] = [];
    
            //     Datex.ReactiveValue.observeAndInit(children, () => {
            //         scheduler.schedule(
            //                 Task(resolve => {
            //                     appendNew(parent, Array.isArray(children) ? children : [children], lastChildren, (e) => {
            //                         lastChildren = e;
            //                         resolve();
            //                     });
            //                 })
            //             ); 
            //         },
            //         undefined,
            //         null, 
            //         {
            //             recursive: false,
            //             types: [Datex.ReactiveValue.UPDATE_TYPE.INIT]
            //         }
            //     )
            // }
        }

        // is iterable (no ref, collapse recursive)
        // else if (children instanceof Array) {
        //     for (const child of children) {
        //         this.append(parent, child);
        //     }
        // }

        // is not a ref iterable
        else return this._append(parent, Array.isArray(children) ? children : [children]);
    }


    _append<T extends Element|DocumentFragment>(parent:T, children:appendableContent[]):T {
        // use content if parent is <template>
        const element = parent instanceof this.context.HTMLTemplateElement ? parent.content : parent;

        // Handle HTMLTextAreaElement element body
        if (element?.tagName?.toLowerCase?.() === "textarea") {
            const reactiveProps = children.find(e => e instanceof Datex.ReactiveValue);
            if (reactiveProps) {
                this.setLiveAttribute(element, "value", reactiveProps);
                return parent;
            }
        }

        for (let child of children) {
            child = (child as any)?.[JSX_INSERT_STRING] ? (child as any).val : child; // collapse safely injected strings

            const {node} = this.valueToDOMNode(child);

            // set shadow root or append
            this.appendElementOrShadowRoot(element, node);
        }

        return parent;
    }

	setElementAttribute<T extends Element>(element:T, attr:string, value:Datex.RefOrValue<unknown>|LazyPointer<unknown>|((...args:unknown[])=>unknown)|{[JSX_INSERT_STRING]:true, val:string}, rootPath?:string|URL):boolean|Promise<boolean> {
        
        // not an element (e.g DocumentFragment)
        if (!(element instanceof this.context.Element)) return false;

        // valid attribute name?
        // not an HTML attribute
        if (!(
            // if one of the following is true, the attribute is added
            attr.startsWith("data-") ||
            attr.startsWith("aria-") ||
            (!element.tagName.startsWith("UIX-") && element.tagName.includes("-")) || // is custom element, but not a UIX component
            defaultElementAttributes.includes(<typeof defaultElementAttributes[number]>attr) || 
            elementEventHandlerAttributes.includes(<typeof elementEventHandlerAttributes[number]>attr) ||
            (<readonly string[]>htmlElementAttributes[<keyof typeof htmlElementAttributes>element.tagName.toLowerCase()])?.includes(<typeof htmlElementAttributes[keyof typeof htmlElementAttributes][number]>attr) ||
            (<readonly string[]>svgElementAttributesLowercase[<keyof typeof svgElementAttributesLowercase>element.tagName.toLowerCase()])?.includes(<typeof svgElementAttributes[keyof typeof svgElementAttributes][number]>attr) )) {
                return false;
        }

        // warnings for invalid attribute usage
        // setting the 'value' attribute of a <input> checkbox element
        if (element instanceof this.context.HTMLInputElement && attr == "value" && element.getAttribute("type") == "checkbox" && typeof Datex.ReactiveValue.collapseValue(value, true, true) == "boolean") {
            logger.warn(`You are assigning the "value" attribute of an <input type="checkbox"> to a boolean value. This has no effect on the checkbox state. Did you mean to use the "checked" attribute instead\\?`)
        }

        // value:selected is only allowed for input type="radio"
        else if (attr == "value:selected" && !(element instanceof this.context.HTMLInputElement && (element as HTMLInputElement).type == "radio")) {
            throw new Error("The \"value:selected\" attribute is only allowed for <input type=\"radio\"> elements");
        }
        
        value = value?.[JSX_INSERT_STRING] ? value.val : value; // collapse safely injected strings

        // first await, if value is promise
        if (value instanceof Promise) return value.then(v=>this.setElementAttribute(element, attr, v, rootPath))

        if (!element) return false;
        value = Datex.Pointer.pointerifyValue(value)

        // LazyPointer or lazy pointer property
        if (
            value instanceof LazyPointer ||
            (value instanceof PointerProperty && value.lazy_pointer)
        ) {
            value.onLoad(() => {
                this.setElementAttribute(element, attr, value, rootPath)
            })
            return true;
        }

        // Datex Ref
        else if (value instanceof Datex.ReactiveValue) {
            return this.setLiveAttribute(element, attr, value, rootPath);
        }

        // default
        else return this.setAttribute(element, attr, value, rootPath)
    }

    private async handleSetVal(ref: Datex.ReactiveValue, element: HTMLInputElement, val:any, type?: "number"|"bigint"|"boolean"|"time") {
        if (this.defaultInputValidation.number?.enabled && type == "number") {
            if (isNaN(Number(val))) {
                element.setCustomValidity(Datex.ReactiveValue.collapseValue(this.defaultInputValidation.number.message, true, true) as string)
                element.reportValidity()
                return;
            }
        }

        if (this.defaultInputValidation.bigint?.enabled && type == "bigint") {
            if (!val.match(/^-?\d+$/)) {
                element.setCustomValidity(Datex.ReactiveValue.collapseValue(this.defaultInputValidation.bigint.message, true, true) as string)
                element.reportValidity()
                return;
            }
        }

        if (type == "boolean") val = Boolean(val);
        else if (type == "bigint") val = BigInt(val);
        else if (type == "number") val = Number(val);

        try {
            await ref.setVal(val)
            element.setCustomValidity("")
            element.reportValidity()
        }
        catch (e) {
            const message = e?.message ?? e?.toString()
            element.setCustomValidity(message)
            element.reportValidity()
        }
    }


    private setLiveAttribute<T extends Element>(element:T, attr:string, value:Datex.RefLike<unknown>, rootPath?:string|URL):boolean {
        const isInputElement = element.tagName.toLowerCase() === "input";
        const isSelectElement = element.tagName.toLowerCase() === "select";
        const isTextareaElement = element.tagName.toLowerCase() === "textarea";
        const isDateInput = isInputElement && (
            (element as unknown as HTMLInputElement).type == "datetime-local" ||
            (element as unknown as HTMLInputElement).type == "date" ||
            (element as unknown as HTMLInputElement).type == "time" ||
            (element as unknown as HTMLInputElement).type == "month" ||
            (element as unknown as HTMLInputElement).type == "week"
        );

        let type = Datex.Type.ofValue(value);
        if (type instanceof Datex.Conjunction) {
            // find a type that is a Datex.Type
            for (const t of type) {
                if (t instanceof Datex.Type) {
                    type = t;
                    break;
                }
            }
        }

        // bind value (used for datex-over-http updates)
        if (attr == "value" || attr == "checked") {
            if (!(<DOMUtils.elWithUIXAttributes><unknown>element)[DOMUtils.ATTR_BINDINGS]) 
                (<DOMUtils.elWithUIXAttributes><unknown>element)[DOMUtils.ATTR_BINDINGS] = new Map<string, Datex.ReactiveValue>();
            (<DOMUtils.elWithUIXAttributes><unknown>element)[DOMUtils.ATTR_BINDINGS].set(attr, value)
        }
        else {
            if (!(<DOMUtils.elWithUIXAttributes><unknown>element)[DOMUtils.ATTR_DX_VALUES]) 
                (<DOMUtils.elWithUIXAttributes><unknown>element)[DOMUtils.ATTR_DX_VALUES] = new Map<string, Datex.ReactiveValue>();
            (<DOMUtils.elWithUIXAttributes><unknown>element)[DOMUtils.ATTR_DX_VALUES].set(attr, value)
        }
 
        // :out attributes
        if ((isSelectElement || isInputElement || isTextareaElement) && (attr == "value:selected" || attr == "value:out" || attr == "value:in" || attr == "value")) {

            const event = isSelectElement ? 'change' : 'input';
            const inputElement = element as unknown as HTMLInputElement;
            // out
            if (attr == "value" || attr == "value:out" || attr == "value:selected") {
                if (!(type instanceof Datex.Type)) {
                    console.warn("Value has no type", value);
                }
                else if (type.matchesType(Datex.Type.std.text)) element.addEventListener(event, () => this.handleSetVal(value, inputElement, inputElement.value))
                else if (type.matchesType(Datex.Type.std.decimal)) element.addEventListener(event, () => {
                    // date input
                    if (isDateInput) {
                        this.handleSetVal(value, inputElement, new Time((element as unknown as HTMLInputElement).valueAsDate ?? new Date((element as unknown as HTMLInputElement).value)), "number")
                    }
                    // normal input
                    else {
                        this.handleSetVal(value, inputElement, inputElement.value, "number")
                    }
                })
                else if (type.matchesType(Datex.Type.std.integer)) element.addEventListener(event, () => this.handleSetVal(value, inputElement, inputElement.value, "bigint"))
                else if (type.matchesType(Datex.Type.std.boolean)) element.addEventListener(event, () => this.handleSetVal(value, inputElement, inputElement.value, "boolean"))
                else if (type.matchesType(Datex.Type.std.void) || type.matchesType(Datex.Type.std.null)) {console.warn("setting value attribute to " + type, element)}
                else if (type.matchesType(Datex.Type.std.time)) element.addEventListener(event, () => {
                    this.handleSetVal(value, inputElement, new Time((element as unknown as HTMLInputElement).valueAsDate ?? new Date((element as unknown as HTMLInputElement).value)), "time")
                })
                else throw new Error("The type "+type+" is not supported for the '"+attr+"' attribute of the <"+element.tagName.toLowerCase()+"> element");


                // for all input elements that support a max, min or step attribute: listen for attribute changes and update the output value
                if (isInputElement && (inputElement.type == "number" || inputElement.type == "range")) {
                    const observer = new MutationObserver(() => {
                        if (type.matchesType(Datex.Type.std.decimal)) this.handleSetVal(value, inputElement, inputElement.value, "number");
                        else if (type.matchesType(Datex.Type.std.integer)) this.handleSetVal(value, inputElement, inputElement.value, "bigint");
                    });
                    observer.observe(inputElement, {attributes: true, attributeFilter: ["max", "min", "step"]})
                }

            }

            // value:selected initial state
            if (attr == "value:selected") {
                (<DOMUtils.elWithUIXAttributes><unknown>inputElement)[DOMUtils.ATTR_SELECTED_BINDING] = value;
                // check if the defined value of the input is equal to the value of the pointer
                if (inputElement.value == value.val) inputElement.checked = true;
            }
            
            // in
            if (attr == "value" || attr == "value:in" || attr == "value:selected") {
                const valid = attr=="value:selected" ? true : this.setAttribute(element, "value", value.val, rootPath)
                const val = value;
                if (valid) {
                    weakAction(
                        // weak dependencies for init
                        {element}, 
                        // init (called once)
                        ({element}) => {
                            use("allow-globals", this, logger, val, rootPath, isolatedScope, attr)
                            const handler = isolatedScope(v => {
                                use("allow-globals", this, logger, rootPath, element, attr)
                                const deref = element.deref();
                                if (!deref) {
                                    logger.warn("Undetected garbage collection (uix-w0001)");
                                    return;
                                }
                                // if value:selected, only update selection state
                                if (attr == "value:selected") {
                                    if (deref.value == v) deref.checked = true;
                                }
                                // set value attribute
                                else {
                                    this.setAttribute(deref, "value", v, rootPath);
                                }
                            })
                            val.observe(handler);
                            return handler;
                        }, 
                        // deinit (called when a weak init dependency is removed) - not guaranteed to be called
                        (handler, _, {val}) => val.unobserve(handler),
                        // weak deinit dependencies (allow gc)
                        {val}
                    );
                }
                return valid;
            }

            return true;
        }

        // checked attribute
        if (isInputElement && element.getAttribute("type") === "checkbox" && attr == "checked") {
            if (!(element instanceof this.context.HTMLInputElement)) throw new Error("the 'checked' attribute is only supported for <input> elements");

            const inputElement = element as HTMLInputElement;

            if (type.matchesType(Datex.Type.std.boolean)) inputElement.addEventListener('change', () => this.handleSetVal(value, inputElement, inputElement.checked, "boolean"))
            else if (type.matchesType(Datex.Type.std.void)) {console.warn("setting checked attribute to void")}
            else throw new Error("The type "+type+" is not supported for the 'checked' attribute of the <input> element");
        }

        // default attributes

        const currentVal = value.val;
        const valid = this.setAttribute(element, attr, currentVal, rootPath)
        // observe pointer value (TODO: this observe currently only works if value is a primitive pointer, otherwise only internal updates are reflected reactively, e.g. for style objects or arrays - this is handled in setAttribute)
        const isPrimitive = (typeof currentVal != "object" || currentVal === null) && typeof currentVal != "function";
        if (isPrimitive && valid) {
            const val = value;
            
            weakAction({element}, 
                ({element}) => {
                    use("allow-globals", this, attr, rootPath, logger, val, isolatedScope);

                    const handler = isolatedScope((v:any,...args) => {
                        use("allow-globals", this, logger, rootPath, element, attr);
                        const deref = element.deref();
                        if (!deref) {
                            logger.warn("Undetected garbage collection (uix-w0001)");
                            return;
                        }
                        this.setAttribute(deref, attr, v, rootPath);
                    });
                    val.observe(handler);
                    return handler;
                },
                (handler, _, {val}) => val.unobserve(handler),
                {val}
            );
        }
        return valid;
    }

    private isNormalFunction(fnSrc:string) {
        return !!fnSrc.match(/^(async\s+)?function(\(| |\*)/)
    }

	private setAttribute(element: Element, attr:string, val:unknown, root_path?:string|URL): boolean {

        // special suffixes:

        // non-module-relative paths if :route suffix
        if (attr.endsWith(":route")) {
            attr = attr.replace(":route", "");
            root_path = undefined;
        }

        // strip :in suffix
        if (attr.endsWith(":in")) {
            attr = attr.replace(":in", "");
        }


        // special attributes--------------

        // update checkbox checked property (bug?)
        if (element instanceof HTMLInputElement && attr == "checked") {
            element.checked = val as boolean;
        }

        // update muted property
        else if (element instanceof HTMLMediaElement && attr == "muted") {
            element.muted = val as boolean;
        }

        // --------------------------------

        // display context event handler function
        if (attr.endsWith(":frontend")) {
            if (typeof val !== "function") throw new Error(`Invalid value for attribute "${attr}" - must be a function`)
            if (client_type == "browser" || val instanceof JSTransferableFunction) {
                // don't change, already a JSTransferableFunction or in frontend context
            }
            else if (JSTransferableFunction.functionIsAsync(val as (...args: unknown[]) => unknown)) {
                // async! (always returns true, doesn't await promise)
                JSTransferableFunction
                    .createAsync(val as (...args: unknown[]) => Promise<unknown>)
                    .then(fn => {
                        this.setAttribute(element, attr, fn, root_path)
                        // auto-inject 'this' context
                        if (this.isNormalFunction(fn.source)) fn.deps['this'] = element
                    })
                return true;
            }
            else {
                val = JSTransferableFunction.create(val as (...args: unknown[]) => unknown);
                
                // auto-inject 'this' context
                if (this.isNormalFunction((val as JSTransferableFunction).source)) (val as JSTransferableFunction).deps['this'] = element
            }
            attr = attr.replace(":frontend", "");

        }

        // invalid :out attributes here
        if (attr.endsWith(":out") || attr.endsWith(":selected")) throw new Error("Invalid value for "+attr+" attribute - must be a pointer");

        // value attribute
        else if (attr == "value") {
            // handle select options
            if (element.tagName.toLowerCase() === "select") {
                for (const option of element.childNodes) {
                    if (option instanceof this.context.HTMLOptionElement) {
                        if (option.value == val) {
                            option.setAttribute("selected","");
                            break;
                        }
                    }
                }
            }
            // set value property
            else {
                // if date input and value < 0, ignore
                if (element instanceof HTMLInputElement && (element as HTMLInputElement).type == "datetime-local" && !(new Date(val as any).getTime() > 0)) return;
                const newValue = this.formatAttributeValue(val, attr, root_path, element);
                if ((element as HTMLInputElement).value !== newValue) (element as HTMLInputElement).value = newValue;
            }

            // handle DOMUtils.ATTR_SELECTED_BINDING
            if ((<DOMUtils.elWithUIXAttributes>element)[DOMUtils.ATTR_SELECTED_BINDING]) {
                if ((<DOMUtils.elWithUIXAttributes>element)[DOMUtils.ATTR_SELECTED_BINDING].val == val) {
                    (element as HTMLInputElement).checked = true;
                }
            }
        }

        // set datex-update
        else if (attr == "datex-update") {
            (<DOMUtils.elWithUIXAttributes><unknown>element)[DOMUtils.DATEX_UPDATE_TYPE] = val as string;
        }

        // set stylesheet
        else if (attr == "stylesheet") {
            element.append(this.createHTMLElement(`<link rel="stylesheet" href="${this.formatAttributeValue(val, attr, root_path, element)}?scope"/>`))
        }

        // update checkbox checked property (bug?)
        else if (element instanceof this.context.HTMLDialogElement && attr == "open") {

            const theVal = val;

            weakAction({element}, 
                ({element}) => {
                    use("allow-globals", theVal, logger, Datex, isolatedScope);
                    const handler = isolatedScope((val:any) => {
                        use("allow-globals", logger, element);
                        const deref = element.deref();
                        if (!deref) {
                            logger.warn("Undetected garbage collection (uix-w0001)");
                            return;
                        }
                        if (val) deref.showModal();
                        else deref.close()
                    });
                    Datex.ReactiveValue.observeAndInit(theVal, handler);
                    return handler;
                }, 
                (handler) => use("allow-globals", Datex, theVal) && Datex.ReactiveValue.unobserve(theVal, handler)
            );
            
        }

        // display shorthand for style.display
        else if (attr == "display") {
            this.setCSSProperty(element as HTMLElement, "display", val as boolean);
        }

        // class mapping
        else if (attr == "class" && typeof val == "object") {

            const update = (key:string, val:Datex.RefOrValue<boolean>) => {
                if (Datex.ReactiveValue.collapseValue(val, true, true)) element.classList.add(key);
                else element.classList.remove(key);
            }
            const updateAll = (obj: Record<string, Datex.RefOrValue<boolean>>) => {
                for (const [key, val] of Object.entries(obj)) update(key, val);
            }

            // handle array updates
            let previousArray = [] as Array<string>;
            const updateArray = (arr: Array<string>) => {
                if (previousArray) {
                    for (const key of previousArray) {
                        if (!arr.includes(key)) {
                            element.classList.remove(key);
                        }
                    }
                }
                element.classList.add(...arr);
                previousArray = [...arr];
            }
            
            if (Datex.ReactiveValue.isRef(val)) {
                Datex.ReactiveValue.observeAndInit(val, (v, k, t) => {
                    // update class list from array
                    if (val instanceof Array) updateArray(val);
                    // update class list from object
                    else {
                        if (t == Datex.Pointer.UPDATE_TYPE.INIT) updateAll(v);
                        else if (typeof k == "string") update(k, v);
                    }  
                })
            }
            // simple object with pointers as properties
            else {
                if (val instanceof Array) updateArray(val);
                else {
                    updateAll(val);
                    for (const [key, value] of Object.entries(val)) {
                        if (value instanceof Datex.ReactiveValue) value.observe(v => update(key, v));
                    }
                }
            }
            
        }
    

        // special attribute values
        else if (val === false) element.removeAttribute(attr);
        else if (val === true || val === undefined) element.setAttribute(attr,"");

        // video src => srcObject
        else if (element instanceof this.context.HTMLVideoElement && attr === "src" && globalThis.MediaStream && val instanceof MediaStream) {
            element.srcObject = val;
        }

        // src path with import map specifier
        // TODO: currently only enabled for specific folder names to keep backwards compatibility, this should be enabled for all paths
        else if ((attr === "src" || attr === "href") && typeof val == "string" && (val.startsWith("common/") || val.startsWith("frontend/"))) {
            element.setAttribute(attr, `/@uix/src/${val}`);
        }

        // event listener
        else if (attr.startsWith("on")) {
            for (const handler of ((val instanceof Array || val instanceof Set) ? val : [val])) {
                if (typeof handler == "function") {
                    const eventName = <keyof HTMLElementEventMap & string>attr.replace("on","").toLowerCase();
                    element.addEventListener(eventName, handler as any);
                    // save in [DOMUtils.EVENT_LISTENERS]
                    if (!(<DOMUtils.elWithUIXAttributes>element)[DOMUtils.EVENT_LISTENERS]) (<DOMUtils.elWithUIXAttributes>element)[DOMUtils.EVENT_LISTENERS] = new Map<keyof HTMLElementEventMap, [Set<Function>, boolean]>();
                    // clear previous standalone listeners for this event
                    for (const [listener, isStandalone] of (<DOMUtils.elWithUIXAttributes>element)[DOMUtils.EVENT_LISTENERS].get(eventName) ?? []) {
                        if (isStandalone) element.removeEventListener(eventName, listener as any);
                    }
                    if (!(<DOMUtils.elWithUIXAttributes>element)[DOMUtils.EVENT_LISTENERS].has(eventName)) (<DOMUtils.elWithUIXAttributes>element)[DOMUtils.EVENT_LISTENERS].set(eventName, new Set());
                    (<DOMUtils.elWithUIXAttributes>element)[DOMUtils.EVENT_LISTENERS].get(eventName)!.add([handler, false]);
                }
                else if (typeof handler == "string") element.setAttribute(attr, handler);
                else {
                    console.log(attr,handler)
                    throw new Error("Cannot set event listener for element attribute '"+attr+"'")
                }
            }
            
        }
        // special form 'action' callback
        else if (element instanceof this.context.HTMLFormElement && attr === "action") {
            for (const handler of ((val instanceof Array || val instanceof Set) ? val : [val])) {
                // action callback function
                if (typeof handler == "function") {
                    const eventName = "submit";

                    // backend function
                    let ptr = Datex.Pointer.getByValue(handler);

                    if (!ptr) {
                        if (client_type == "deno") {
                            ptr = Datex.Pointer.createOrGet(handler);
                            ptr.is_persistent = true;
                            // TODO: garbage collection for ptr when form element is garbage collected
                        }
                        else {
                            console.warn("Frontend functions for form action are not supported yet")
                        }
                    }

                    if (client_type == "browser" && ptr?.is_origin) {
                        console.warn("Frontend functions for form action are not supported yet")
                    }
                    else {
                        element.setAttribute("action", `/@uix/form-action/${ptr.idString()}`);
                    }

                    // save in [DOMUtils.EVENT_LISTENERS]
                    if (!(<DOMUtils.elWithUIXAttributes>element)[DOMUtils.EVENT_LISTENERS]) (<DOMUtils.elWithUIXAttributes>element)[DOMUtils.EVENT_LISTENERS] = new Map<keyof HTMLElementEventMap, [Set<Function>, boolean]>();
                    if (!(<DOMUtils.elWithUIXAttributes>element)[DOMUtils.EVENT_LISTENERS].has(eventName)) (<DOMUtils.elWithUIXAttributes>element)[DOMUtils.EVENT_LISTENERS].set(eventName, new Set());
                    (<DOMUtils.elWithUIXAttributes>element)[DOMUtils.EVENT_LISTENERS].get(eventName)!.add([handler, false]);
                }
                // default "action" (path)
                else element.setAttribute(attr, this.formatAttributeValue(val, attr, root_path, element));
            }
            
        }
    
        // normal attribute
        else {
            if (val === false) {
                if (element.hasAttribute(attr)) element.removeAttribute(attr);
            }
            else if (val === true) {
                if (!element.hasAttribute(attr)) element.setAttribute(attr, "");
            }
            else {
                const newValue = this.formatAttributeValue(val, attr, root_path, element);
                if (element.getAttribute(attr) !== newValue) element.setAttribute(attr, newValue);
            }
        }

    
        return true;
        
    }

    getFormattedWeek(d: Date) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1)).getTime();
        const weekNo = Math.ceil(( ( (d.getTime() - yearStart) / 86400000) + 1)/7);
        return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2,"0")}`;
    }

    getDateFromFormattedWeek(weekString: string) {
        const [year, week] = weekString.split("-W").map(Number)

        if (week < 1 || week > 53) {
          throw new RangeError("ISO 8601 weeks are numbered from 1 to 53");
        } else if (!Number.isInteger(week)) {
          throw new TypeError("Week must be an integer");
        } else if (!Number.isInteger(year)) {
          throw new TypeError("Year must be an integer");
        }
        const simple = new Date(year, 0, 1 + (week - 1) * 7);
        const dayOfWeek = simple.getDay();
        const isoWeekStart = simple;
        isoWeekStart.setDate(simple.getDate() - dayOfWeek + 1);
        if (dayOfWeek > 4) {
            isoWeekStart.setDate(isoWeekStart.getDate() + 7);
        }
        if (isoWeekStart.getFullYear() > year ||
            (isoWeekStart.getFullYear() == year &&
             isoWeekStart.getMonth() == 11 &&
             isoWeekStart.getDate() > 28)) {
            throw new RangeError(`${year} has no ISO week ${week}`);
        }
    
        return isoWeekStart;
    }
    
    formatAttributeValue(val:any, attr: string, root_path?:string|URL, element?:Element): string {
        if (root_path==undefined) return val?.toString?.() ?? ""
        else if (attr == "value" && element instanceof HTMLInputElement) {
            if (element.type == "datetime-local") {
                const unixTime = val instanceof Date ? val.getTime() : new Date(val).getTime();
                const showSeconds = element.step && Number(element.step) < 60;
                return new Date(unixTime + new Date(unixTime).getTimezoneOffset() * -60 * 1000).toISOString().slice(0,showSeconds ? -5 : -8);
            }
            else if (element.type == "month") {
                const date = val instanceof Date ? val : new Date(val);
                return date.toISOString().slice(0,7)
            }
            else if (element.type == "week") {
                try {
                    let date = val instanceof Date ? val : new Date(val);
                    // if invalid date, use getDateFromFormattedWeek
                    if (isNaN(date.getTime())) date = this.getDateFromFormattedWeek(val);
                    return this.getFormattedWeek(date);
                }
                catch {
                    // return current value of input if invalid
                    return element.value;
                }
            }
            else if (element.type == "date") {
                const date = val instanceof Date ? val : new Date(val);
                return date.toISOString().slice(0,10)
            }
            else if (element.type == "time") {
                const date = val instanceof Date ? val : new Date(val);
                // show seconds if step is < 60
                if (element.step && Number(element.step) < 60) return date.toISOString().slice(11,19)
                else return date.toISOString().slice(11,16)
            }
            else {
                return val?.toString?.() ?? ""
            }
        } 
        else if (typeof val == "string" && (val.startsWith("./") || val.startsWith("../"))) return new URL(val, root_path).toString();
        else return val?.toString?.() ?? ""
    }


    setCSS<T extends HTMLElement>(element:T, property:string, value?:Datex.CompatValue<string|number>):T
    setCSS<T extends HTMLElement>(element:T, properties:{[property:string]:Datex.CompatValue<string|number>}):T
    setCSS<T extends HTMLElement>(element:T, style:Datex.CompatValue<string>):T
    setCSS<T extends HTMLElement>(element:T, properties_object_or_property:{[property:string]:Datex.CompatValue<string|number>}|Datex.CompatValue<string>, value?:Datex.CompatValue<string|number>):T {
        let properties:{[property:string]:Datex.RefOrValue<string|number|undefined>};
        if (typeof properties_object_or_property == "string" && value != undefined) properties = {[properties_object_or_property]:value};
        else if (typeof properties_object_or_property == "string" || (properties_object_or_property instanceof Datex.Value && Datex.Type.ofValue(properties_object_or_property) == Datex.Type.std.text)) {
            this.setElementAttribute(element, "style", properties_object_or_property)
            return element;
        }
        else properties = Datex.ReactiveValue.collapseValue(properties_object_or_property,true,true) as {[property:string]:Datex.CompatValue<string|number|undefined>};

        if (properties) {
            for (const [property, value] of Object.entries(properties)) {
                this.setCSSProperty(element, property, value);
            }
        }

        if (properties_object_or_property instanceof Datex.ReactiveValue && typeof properties_object_or_property == "object") {
            Datex.ReactiveValue.observe(properties_object_or_property, () => {
                for (const [property, value] of Object.entries(properties_object_or_property.val)) {
                    this.setCSSProperty(element, property, value);
                }
            });
        }

        return element;
    }

    /**
     * When enabled, the binding is not preserved when transferring the element to another context
     */
    enableCSSPropertyWeakBinding<T extends HTMLElement>(element:T, property:string, weak = true) {
        if (!(<DOMUtils.elWithUIXAttributes><unknown>element)[DOMUtils.STYLE_WEAK_PROPS]) 
            (<DOMUtils.elWithUIXAttributes><unknown>element)[DOMUtils.STYLE_WEAK_PROPS] = new Map<string, boolean>();
        (<DOMUtils.elWithUIXAttributes><unknown>element)[DOMUtils.STYLE_WEAK_PROPS].set(property, weak)
    }

    /**
     * Set css property of an element, updates reactively if pointer
     * If weakBinding is true, the binding is not preserved when transferring the element to another context
     */
    setCSSProperty<T extends HTMLElement>(element:T, property:string, value:Datex.RefOrValue<string|number|undefined|boolean>, weakBinding = false, unit?: string):T{
        // convert camelCase to kebab-case
        property = property?.replace(/[A-Z]/g, x => `-${x.toLowerCase()}`);
        // none
        if (value == undefined) {
            if (element.style.removeProperty) element.style.removeProperty(property);
            // @ts-ignore style property access
            else delete element.style[property];
        }

        // // UIX color
        // else if (value instanceof Datex.PointerProperty && value.pointer.val == Theme.colors) {
        //     if (element.style.setProperty) element.style.setProperty(property, `var(--${value.key})`); // autmatically updated css variable
        //     // @ts-ignore style property access
        //     else element.style[property] = `var(--${value.key})`
        // }
        // other Datex CompatValue
        else {

            // remember style ref binding
            if (!weakBinding && Datex.ReactiveValue.isRef(value)) {
                if (!(<DOMUtils.elWithUIXAttributes><unknown>element)[DOMUtils.STYLE_DX_VALUES]) 
                    (<DOMUtils.elWithUIXAttributes><unknown>element)[DOMUtils.STYLE_DX_VALUES] = new Map<string, Datex.ReactiveValue>();
                (<DOMUtils.elWithUIXAttributes><unknown>element)[DOMUtils.STYLE_DX_VALUES].set(property, value)
            }
            
            Datex.ReactiveValue.observeAndInit(value, (v,k,t) => {
                if (property == "display" && typeof v == "boolean") {
                    v = v ? (globalThis.CSS?.supports("display: revert-layer") ? "revert-layer" : "revert") : "none";
                }

                if (v == undefined) {
                    if (element.style.removeProperty) element.style.removeProperty(property);
                    // @ts-ignore style property access
                    else delete element.style[property];
                }
                else {
                    if (!element.style) {
                        // TODO: handle this case if trying to set global css variable on document (for reactive css)
                        return;
                    }
                    if (element.style.setProperty) element.style.setProperty(property, this.getCSSProperty(<string>v, undefined, unit));
                    // @ts-ignore style property access
                    else element.style[property] = this.getCSSProperty(v, undefined, unit);
                }
            }, undefined, undefined);
        }
        return element;
    }

    readonly color_names = {"aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4","azure":"#f0ffff",
        "beige":"#f5f5dc","bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd","blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887",
        "cadetblue":"#5f9ea0","chartreuse":"#7fff00","chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff",
        "darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b","darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f",
        "darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a","darkseagreen":"#8fbc8f","darkslateblue":"#483d8b","darkslategray":"#2f4f4f","darkturquoise":"#00ced1",
        "darkviolet":"#9400d3","deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969","dodgerblue":"#1e90ff",
        "firebrick":"#b22222","floralwhite":"#fffaf0","forestgreen":"#228b22","fuchsia":"#ff00ff",
        "gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520","gray":"#808080","green":"#008000","greenyellow":"#adff2f",
        "honeydew":"#f0fff0","hotpink":"#ff69b4",
        "indianred ":"#cd5c5c","indigo":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c",
        "lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00","lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2",
        "lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1","lightsalmon":"#ffa07a","lightseagreen":"#20b2aa","lightskyblue":"#87cefa","lightslategray":"#778899","lightsteelblue":"#b0c4de",
        "lightyellow":"#ffffe0","lime":"#00ff00","limegreen":"#32cd32","linen":"#faf0e6",
        "magenta":"#ff00ff","maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd","mediumorchid":"#ba55d3","mediumpurple":"#9370d8","mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee",
        "mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc","mediumvioletred":"#c71585","midnightblue":"#191970","mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5",
        "navajowhite":"#ffdead","navy":"#000080",
        "oldlace":"#fdf5e6","olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6",
        "palegoldenrod":"#eee8aa","palegreen":"#98fb98","paleturquoise":"#afeeee","palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd","powderblue":"#b0e0e6","purple":"#800080",
        "rebeccapurple":"#663399","red":"#ff0000","rosybrown":"#bc8f8f","royalblue":"#4169e1",
        "saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57","seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090","snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4",
        "tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0",
        "violet":"#ee82ee",
        "wheat":"#f5deb3","white":"#ffffff","whitesmoke":"#f5f5f5",
        "yellow":"#ffff00","yellowgreen":"#9acd32"
    };

    // convert DatexCompatValue to css property
    getCSSProperty(value:Datex.RefOrValue<number|string>, use_css_variables = true, unit?: string):string {
        // UIX color value
        // if (use_css_variables && value instanceof Datex.PointerProperty && value.pointer.val == Theme.colors) {
        //     value = `var(--${value.key})`; // autmatically updated css variable
        // }

        // number value to unit (default px)
        if (typeof value == "number") return value.toString() + (unit||"px");

        else if (use_css_variables) return this.escapeCSSValue(value) ?? '';
        // try to collapse value
        else if (value!=undefined) {
            // css variable
            if (value.toString().startsWith('var(--')) return this.context.getComputedStyle(this.document.documentElement).getPropertyValue(value?.toString().replace('var(','').replace(')','')).trim();
            // css color name
            else if (!value.toString().startsWith("#")) return this.color_names[<keyof typeof this.color_names>value.toString().toLowerCase()] ?? ''
            // normal string value
            else return this.escapeCSSValue(value);
        }
        else return '';
    }


    escapeCSSValue(value: any) {
        return (value?.toString() as string).replace(/(;[\S\s]*)$/, (_, p1) => {
            return '/*' + p1.replace(/\*\//, "* /") + '*/';
        })
    }
    

    valuesToDOMElement(...values:any[]): Node|DocumentFragment {
        
        if (values.length == 1) {
            return this.valueToDOMNode(values[0]).node;
        }
        else {
            const fragment = new this.context.DocumentFragment();
            values
                .map(v => this.valueToDOMNode(v).node)
                .forEach(c=>this.append(fragment, c))
            return fragment;
        }
    }

    valueToDOMNode(value: unknown) {

        let loadPromise: Promise<Node>|undefined
        let newNode: any;

        // is function

        // collapse pointer if function
        if (value instanceof Datex.ReactiveValue && typeof value.val == "function") {
            value = value.val;
        }

        if (typeof value == "function") {
            if (client_type == "deno") {
                newNode = document.createElement("uix-placeholder");
                this.addProxy(newNode);
                if ((value as any)[DOMUtils.PLACEHOLDER_CONTENT]) {
                    this.append(newNode, (value as any)[DOMUtils.PLACEHOLDER_CONTENT]);
                }
                newNode![DX_REPLACE] = value;
            }
            else {
                if (value instanceof JSTransferableFunction) {
                    // waits until lazy dependencies are loaded
                    value = value.callLazy()
                }
                else {
                    value = value()
                }
            }
        }

        // wait for lazyPointer or lazy pointer property (convert to promise)
        if (
            value instanceof LazyPointer ||
            (value instanceof Datex.PointerProperty && value.lazy_pointer)
        ) {
            const lazyPtr = value;
            value = new Promise(resolve => lazyPtr.onLoad(v => resolve(v)));
        }


        // wait for promise
        if (value instanceof Promise) {
            loadPromise = value.then(v=>{
                const node = this.valuesToDOMElement(v);
                placeholder.replaceWith(node)
                return node;
            });

            const placeholder = this.document.createElement("uix-placeholder")
            this.addProxy(placeholder);
            newNode = placeholder;
        }
        else if (newNode == undefined) {
            newNode = value;
        }

        // // is uix-fragment: no additional reactive wrapper needed, just return the fragment
        // if (newNode instanceof Datex.ReactiveValue && newNode.val instanceof HTMLElement && newNode.val.tagName.toLowerCase() == "uix-fragment") {
        //     newNode = newNode.val;
        // }

        // unsupported value - create text/content node
        if (!(newNode instanceof this.context.Node || newNode instanceof this.context.DocumentFragment || newNode instanceof this.context.Comment)) {
            newNode = this.getNode(newNode);
        }

        return {
            node: newNode,
            loadPromise
        }
    }

    getNode(content:any) {
        const contentVal = val(content);
        // either use existing node or create new text node
        const node = contentVal instanceof Node ? contentVal : this.document.createTextNode("") as unknown as Text;
        (node as any)[DX_VALUE] = content;

        // lazy pointer or lazy pointer property
        if (
            content instanceof LazyPointer || 
            (content instanceof PointerProperty && content.lazy_pointer)
        ) {
            content.onLoad(() => {
                this.bindNode(node, content)
            })
        }
        // ref
        else if (content instanceof Datex.ReactiveValue) {
            this.bindNode(node, content)
        }     
       
        else {
            node.textContent = (content!=undefined && content!==false) ? (<any>content).toString() : ''
        }

        return node;
    }

    bindNode(node: Node, ref:Datex.RefLike<unknown>) {

        weakAction({node}, 
            ({node}) => {
                use("allow-globals", logger, Datex, isolatedScope, ref);

                let prevNode:{node?:WeakRef<Node>} = {node};

                // TODO: dont reference 'ref' in handler, use args from handler
                const handler = isolatedScope((...args:any[]) => {
                    use("allow-globals", logger, ref, prevNode);

                    let prevNodeDeref = prevNode.node?.deref();
                    if (!prevNodeDeref) return;

                    try {
                        let val = ref.val;

                        // replace previous node if it is a node, otherwise update text content
                        if (val instanceof Node) {
                            if (val instanceof DocumentFragment) {
                                const childNodes = val.childNodes;
                                val = document.createElement("uix-fragment");
                                val.append(...childNodes);
                            }
                            prevNode.node = new WeakRef(val);
                            prevNodeDeref.replaceWith(val);
                        }
                        else {
                            if (!(prevNodeDeref instanceof Text)) {
                                const node = document.createTextNode("");
                                prevNode.node = new WeakRef(node);
                                prevNodeDeref.replaceWith(node);
                                prevNodeDeref = node;
                            }
                            prevNodeDeref.textContent = (val!=undefined && val!==false) ? (<any>val).toString() : ''
                        }
                        
                    }
                    catch (e) {
                        // console.error(e)
                    }  
                });

                // TODO: potential memory leak
                if (ref instanceof Datex.Pointer) ref.is_persistent = true;

                Datex.ReactiveValue.observeAndInit(ref, handler);
                return handler;
            }, 
            (handler, _, deps) => {
                use("allow-globals", Datex, ref);
                ref.is_persistent = false;
                Datex.ReactiveValue.unobserve(ref, handler)
            }
        );   
    }

    replaceWith(node: Element, newContent: any, lazy = false) {

        const {node: newNode, loadPromise} = this.valueToDOMNode(newContent)

        // only replace when loaded
        if (lazy && loadPromise) {
            return loadPromise.then(v => {
                node.replaceWith(v)
            })
        }
        // replace immediately
        else node.replaceWith(newNode);
    }

    /**
     * 
     * @param anchor 
     * @param element 
     * @param appendAll if false, only shadowRoot is set, other elements are ignored
     * @returns true if element appended
     */
    appendElementOrShadowRoot(anchor: Element|DocumentFragment, element: Element|DocumentFragment|Text, appendAll = true, insertAfterAnchor = false, onAppend?: ((list: (Node)[]) => void)) {
        const appendedContent: Node[] = [];

        for (const candidate of (element instanceof this.context.DocumentFragment ? [...(element.childNodes as any)] : [element]) as unknown as Node[]) {
            if (anchor instanceof this.context.HTMLElement && candidate instanceof this.context.HTMLTemplateElement && candidate.hasAttribute("shadowrootmode")) {
                if (anchor.shadowRoot) throw new Error("element <"+anchor.tagName.toLowerCase()+"> already has a shadow root")
                const shadowRoot = anchor.attachShadow({mode: (candidate.getAttribute("shadowrootmode")??"open") as "open"|"closed"});
                shadowRoot.append((candidate as HTMLTemplateElement).content);
                appendedContent.push(shadowRoot);
                if (!appendAll) {
                    onAppend?.(appendedContent);
                    return true;
                }
            }
            else if (appendAll) {
                if (insertAfterAnchor)
                    anchor.parentElement?.insertBefore(candidate, anchor.nextSibling); // anchor is sibbling (e.g. old elem)
                else anchor.append(candidate); // anchor is parent
                appendedContent.push(candidate)
            }
        }
        onAppend?.(appendedContent);
        return appendAll;
    }

    // jquery-like event listener (multiple events at once)
    addEventListener<E extends HTMLElement>(target:E, events:string, listener: (this: HTMLElement, ev: Event) => any, options?: boolean | AddEventListenerOptions){
        for (const event of events.split(" ")){
            target.addEventListener(event.trim(), listener, options);
        }
    }

    removeEventListener<E extends HTMLElement>(target:E, events:string, listener: (this: HTMLElement, ev: Event) => any, options?: boolean | AddEventListenerOptions){
        for (const event of events.split(" ")){
            target.removeEventListener(event.trim(), listener, options);
        }
    }

    // jquery-like event listener (multiple events at once + delegate with query selector)
    addDelegatedEventListener<E extends Element>(target:E, events:string, selector:string,  listener: (this: Element, ev: Event) => any, options?: boolean | AddEventListenerOptions){
        for (const event of events.split(" ")){
            target.addEventListener(event.trim(), (event) => {
                if (event.target && event.target instanceof this.context.Element && event.target.closest(selector)) {
                    listener.call(event.target, event)
                }
            }, options);
        }
    }

    addProxy(element:Element) {
        return $(element)
    }
}
