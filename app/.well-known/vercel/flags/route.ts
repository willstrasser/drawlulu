import { getProviderData, createFlagsDiscoveryEndpoint } from "flags/next";
import * as flags from "@/flags";

// `flags/next` declares `origin?: string | Origin` which TS rejects under
// exactOptionalPropertyTypes when the value is `string | Origin | undefined`.
// Cast confines the library type drift to this single discovery endpoint.
export const GET = createFlagsDiscoveryEndpoint(async () =>
  getProviderData(flags as Parameters<typeof getProviderData>[0]),
);
