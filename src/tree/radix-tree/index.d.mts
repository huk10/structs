export class RadixTree {
  /**
   * 删除一个指定的 key，如果 key 不是一个字符串或者是空字符串则忽略。
   * @param {string} key
   */
  remove(key: string): void;

  /**
   * 指定一个 key 返回其关联的值，如果 key 不是一个字符串或者是空字符串则返回 null
   * @param {string} key
   * @return {unknown}
   */
  lookup(key: string): unknown | null;

  /**
   * 指定一个 key 和一个与其关联的 value，将它们放置在树中的合适位置。
   * 1. 如果 key 不是一个字符串或者是空字符串则忽略此次调用
   * 2. 如果树中已经存在该 key 则用新的 value 覆盖上一个 value
   * @param {string} key
   * @param {*} value
   */
  put(key: string, value: unknown): void;

  /**
   * 指定一个 key 返回数中已存在的所有是其前缀的 key
   * 传入非字符串会返回空数组，传入空字符串返回值等同于 keys 方法
   * @param {string} prefix
   * @return {string[]}
   */
  getKeysWithPrefix(prefix: string): string[];

  /**
   * 指定一个 key 返回数中已存在的所有是其前缀的 key 关联的 value
   * 传入非字符串会返回空数组，传入空字符串返回值等同于 values 方法
   * @param {string} prefix
   * @return {unknown[]}
   */
  getValuesWithPrefix(prefix: string): unknown[];

  /**
   * 指定一个 key 返回数中已存在的所有是其前缀的键值对
   * 传入非字符串会返回空数组，传入空字符串返回值等同于 entries 方法
   * @param {string} prefix
   * @return {Array<[string, unknown]>}
   */
  getEntriesWithPrefix(prefix: string): Array<[string, unknown]>;

  /**
   * 查询指定的 key 是否存在于树中，如果 key 不是一个字符串或是空字符串则返回 false
   * @param {string} key
   * @return {boolean}
   */
  containsKey(key: string): boolean;

  /**
   * 查询指定的 value 是否存在于树中.
   * @param value
   * @return {boolean}
   */
  containsValue(value: unknown): boolean;

  /**
   * 查询树中是否存在一个 key 的前缀是指定的字符串。
   * 如果 prefix 不是一个字符串则返回 false，如果是空字符串如果树内至少存在一个元素则返回 true
   * @param {string} prefix
   * @return {boolean}
   */
  containsPrefix(prefix: string): boolean;

  keys(): string[];

  values(): unknown[];

  entries(): Array<[string, unknown]>;

  size(): number;

  clear(): void;
}
