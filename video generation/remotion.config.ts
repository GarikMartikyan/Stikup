// Remotion v4 — overwrite is passed via CLI flag (--overwrite)
import {Config} from '@remotion/cli/config';
import {enableTailwind} from '@remotion/tailwind-v4';

Config.overrideWebpackConfig(enableTailwind);
