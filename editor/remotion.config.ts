import { Config } from "@remotion/cli/config";

// PCs with Windows Smart App Control on can't run Remotion's unsigned headless Chrome ("not a valid Win32
// application"). There, set REEL_BROWSER to Edge's path once (setx REEL_BROWSER "...\msedge.exe").
if (process.env.REEL_BROWSER) Config.setBrowserExecutable(process.env.REEL_BROWSER);
