import promiseRetry from "promise-retry";
import { OperationOptions } from "retry";

export const stringifyErrSliced = (e: unknown, length = 500) =>
  JSON.stringify(e, Object.getOwnPropertyNames(e)).slice(0, length);

// todo log warn
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: () => OperationOptions,
  shouldRetryFn?: (e: unknown) => boolean
): Promise<T> {
  let retriesUsed = 0;
  let errors: string[] = [];
  let lastError: unknown | undefined;

  return promiseRetry(
    (retry) =>
      (async () => {
        if (lastError) {
          retriesUsed++;

          console.log(
            `Retrying. Attempt ${retriesUsed} - ${stringifyErrSliced(
              lastError,
              100
            )}`
          );
        }

        return fn();
      })().catch((e) => {
        if (shouldRetryFn && !shouldRetryFn(e)) {
          throw e;
        }

        lastError = e;

        errors = [...errors, stringifyErrSliced(e)];

        return retry(e);
      }),
    opts()
  ).finally(() => {
    if (retriesUsed > 0) {
      console.log(`Retried ${retriesUsed} times`, {
        errors,
        retriesUsed,
        retryOpts: opts(),
      });
    }
  });
}
