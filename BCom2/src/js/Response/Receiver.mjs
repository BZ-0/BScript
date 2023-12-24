// @ts-nocheck
"use strict"

// for waiting commands
export default class ResponseReceiver {
    /** @type {Function} */
    #resolve = null

    /** @type {Function} */
    #reject = null

    /** */
    #buffer = null

    //
    constructor(_, buffer) {
        this.#buffer = buffer
        this["&data"] = new Promise((resolve, reject) => {
            this.#resolve = resolve
            this.#reject = reject
        })
    }

    //
    get $buffer() {
        return this.#buffer
    }

    //
    async resolve(...args) {
        const _decoded_ = await Promise.all(await args)
        return this.#resolve(..._decoded_)
    }

    //
    async reject(...args) {
        const _decoded_ = await Promise.all(await args)
        console.error(..._decoded_)
        return this.#reject(..._decoded_)
    }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJSZXNwb25zZVJlY2VpdmVyIiwicmVzb2x2ZSIsInJlamVjdCIsImJ1ZmZlciIsImNvbnN0cnVjdG9yIiwiXyIsIlByb21pc2UiLCIkYnVmZmVyIiwiYXJncyIsIl9kZWNvZGVkXyIsImFsbCIsImNvbnNvbGUiLCJlcnJvciJdLCJzb3VyY2VzIjpbIkM6XFxQcm9qZWN0c1xcQlowXFxCQ29tMlxcc3JjXFxjaXZldFxcUmVzcG9uc2VcXFJlY2VpdmVyLmNpdmV0Il0sInNvdXJjZXNDb250ZW50IjpbIi8vIEB0cy1ub2NoZWNrXG5cInVzZSBzdHJpY3RcIjtcblxuLy8gZm9yIHdhaXRpbmcgY29tbWFuZHNcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlc3BvbnNlUmVjZWl2ZXIge1xuICAgIC8qKiBAdHlwZSB7RnVuY3Rpb259ICovXG4gICAgI3Jlc29sdmUgPSBudWxsO1xuXG4gICAgLyoqIEB0eXBlIHtGdW5jdGlvbn0gKi9cbiAgICAjcmVqZWN0ID0gbnVsbDtcblxuICAgIC8qKiAqL1xuICAgICNidWZmZXIgPSBudWxsO1xuXG4gICAgLy9cbiAgICBjb25zdHJ1Y3RvcihfLCBidWZmZXIpIHtcbiAgICAgICAgdGhpcy4jYnVmZmVyID0gYnVmZmVyO1xuICAgICAgICB0aGlzW1wiJmRhdGFcIl0gPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLiNyZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgICAgICAgIHRoaXMuI3JlamVjdCA9IHJlamVjdDtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy9cbiAgICBnZXQgJGJ1ZmZlcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI2J1ZmZlcjtcbiAgICB9XG5cbiAgICAvL1xuICAgIGFzeW5jIHJlc29sdmUoLi4uYXJncykge1xuICAgICAgICBjb25zdCBfZGVjb2RlZF8gPSBhd2FpdCBQcm9taXNlLmFsbChhd2FpdCBhcmdzKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3Jlc29sdmUoLi4uX2RlY29kZWRfKTtcbiAgICB9XG5cbiAgICAvL1xuICAgIGFzeW5jIHJlamVjdCguLi5hcmdzKSB7XG4gICAgICAgIGNvbnN0IF9kZWNvZGVkXyA9IGF3YWl0IFByb21pc2UuYWxsKGF3YWl0IGFyZ3MpO1xuICAgICAgICBjb25zb2xlLmVycm9yKC4uLl9kZWNvZGVkXyk7XG4gICAgICAgIHJldHVybiB0aGlzLiNyZWplY3QoLi4uX2RlY29kZWRfKTtcbiAgICB9XG59O1xuIl0sIm1hcHBpbmdzIjoiQUFBQTtBQUNBLFk7O0FBRUE7QUFDQSxlQUFlLE1BQU1BLGdCQUFnQixDQUFDO0VBQ2xDO0VBQ0EsQ0FBQUMsT0FBUSxHQUFHLElBQUk7O0VBRWY7RUFDQSxDQUFBQyxNQUFPLEdBQUcsSUFBSTs7RUFFZDtFQUNBLENBQUFDLE1BQU8sR0FBRyxJQUFJOztFQUVkO0VBQ0FDLFdBQVdBLENBQUNDLENBQUMsRUFBRUYsTUFBTSxFQUFFO0lBQ25CLElBQUksQ0FBQyxDQUFBQSxNQUFPLEdBQUdBLE1BQU07SUFDckIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUlHLE9BQU8sQ0FBQyxDQUFDTCxPQUFPLEVBQUVDLE1BQU0sS0FBSztNQUM3QyxJQUFJLENBQUMsQ0FBQUQsT0FBUSxHQUFHQSxPQUFPO01BQ3ZCLElBQUksQ0FBQyxDQUFBQyxNQUFPLEdBQUdBLE1BQU07SUFDekIsQ0FBQyxDQUFDO0VBQ047O0VBRUE7RUFDQSxJQUFJSyxPQUFPQSxDQUFBLEVBQUc7SUFDVixPQUFPLElBQUksQ0FBQyxDQUFBSixNQUFPO0VBQ3ZCOztFQUVBO0VBQ0EsTUFBTUYsT0FBT0EsQ0FBQyxHQUFHTyxJQUFJLEVBQUU7SUFDbkIsTUFBTUMsU0FBUyxHQUFHLE1BQU1ILE9BQU8sQ0FBQ0ksR0FBRyxDQUFDLE1BQU1GLElBQUksQ0FBQztJQUMvQyxPQUFPLElBQUksQ0FBQyxDQUFBUCxPQUFRLENBQUMsR0FBR1EsU0FBUyxDQUFDO0VBQ3RDOztFQUVBO0VBQ0EsTUFBTVAsTUFBTUEsQ0FBQyxHQUFHTSxJQUFJLEVBQUU7SUFDbEIsTUFBTUMsU0FBUyxHQUFHLE1BQU1ILE9BQU8sQ0FBQ0ksR0FBRyxDQUFDLE1BQU1GLElBQUksQ0FBQztJQUMvQ0csT0FBTyxDQUFDQyxLQUFLLENBQUMsR0FBR0gsU0FBUyxDQUFDO0lBQzNCLE9BQU8sSUFBSSxDQUFDLENBQUFQLE1BQU8sQ0FBQyxHQUFHTyxTQUFTLENBQUM7RUFDckM7QUFDSixDQUFDIn0=