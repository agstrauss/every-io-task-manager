export type ExtractPromise<T> = T extends Promise<infer P> ? P : T;

export type AsyncReturnType<T extends (...args: any[]) => any> = ExtractPromise<
  ReturnType<T>
>;
