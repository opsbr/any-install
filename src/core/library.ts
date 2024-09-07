// @ts-expect-error TODO
import libraryShText from "./lib/library.sh" with { type: "text" };
// @ts-expect-error TODO
import libraryPs1Text from "./lib/library.ps1" with { type: "text" };

const librarySh = libraryShText as string;
const libraryPs1 = libraryPs1Text as string;

export { librarySh, libraryPs1 };
