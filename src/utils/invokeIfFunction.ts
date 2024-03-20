export default <T>(val: T | (() => T)) =>
  val instanceof Function ? val() : val;
