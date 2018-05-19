import * as Immutable from "immutable";

/**
 * A structure that is to be stored inside the Model.
 * Possibly contains multiple composite parts all mapped to an identifier.
 * An example component might contain multiple data graphs, each of which is associated with a filename.
 */
export class Component<T> {

    /**
     * The root part.
     * @type {string}
     */
    private static ROOT: string = "ROOT";

    /**
     * A mapping of keys to parts.
     */
    private readonly parts: Immutable.Map<string, T>;

    /**
     * Creates a new component.
     * @param parts A mapping of part keys to parts.
     */

    public constructor(parts?: Immutable.Map<string, T>) {
        if (parts) {
            this.parts = parts;
        } else {
            this.parts = Immutable.Map<string, T>();
        }
    }

    /**
     * Retrieves all keys in the component.
     */
    public getAllKeys(): string[] {
        return this.parts.keySeq().toArray();
    }

    /**
     * Retrieves a part of the component.
     * @param key The key for the part to retrieve.
     */
    public getPart(key: string): T {
        return this.parts.get(key);
    }

    /**
     * Retrieve the root part of this component.
     * @returns T
     */
    public getRoot(): T {
        return this.getPart(Component.ROOT);
    }

    /**
     * Retrieve all parts contained in this component.
     */
    public getParts(): T[] {
        return this.parts.valueSeq().toArray();
    }

    /**
     * Retrieve all parts, barring the root.
     * @returns {any[]}
     */
    public getCompositeParts(): [string, T][] {
        let relevantParts = new Array<[string, T]>();
        this.getAllKeys().forEach(k => {
            if (k !== Component.ROOT) {
                relevantParts.push([k, this.parts.get(k)]);
            }
        });

        return relevantParts;
    }

    /**
     * Bind a value to a given key. Returns a component
     * with the updated (key, value) pair.
     * @param key The key to bind a value to.
     * @param value The value to bind to `key`.
     */
    public withPart(key: string, value: T): Component<T> {
        return new Component<T>(this.parts.set(key, value));
    }

    /**
     * Bind a value to the root. Returns a component
     * with the updated (key, value) pair.
     * @param key The key to bind a value to.
     * @param value The value to bind to `key`.
     */
    public withRoot(value: T): Component<T> {
        return new Component<T>(this.parts.set(Component.ROOT, value));
    }
}
