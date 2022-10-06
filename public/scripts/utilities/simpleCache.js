export class SimpleCache {
    constructor(maxLength) {
        this.maxLength = maxLength;
        this.store = {};
    }

    add(key, value) {
        if (Object.keys(this.store).length > this.maxLength) {
            console.log("Cache invalidated");
            this.store = {};
        }
        this.store[key] = value;
    }

    get(key) {
        if (Object.hasOwn(this.store, key)) {
            return this.store[key];
        } else {
            return null;
        }
    }
}