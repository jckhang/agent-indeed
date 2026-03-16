export class IdSequence {
  constructor(prefix, start = 1) {
    this.prefix = prefix;
    this.value = start;
  }

  next() {
    const current = String(this.value).padStart(8, "0");
    this.value += 1;
    return `${this.prefix}_${current}`;
  }
}
