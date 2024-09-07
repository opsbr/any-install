import type { Builder } from "./builder";
import { BuilderPs1 } from "./builder-ps1";
import { BuilderSh } from "./builder-sh";

export type { Builder };
export const sh: BuilderSh = new BuilderSh();
export const ps1: BuilderPs1 = new BuilderPs1();
