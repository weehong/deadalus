import type { Preview } from "@storybook/react-vite";

import "../src/styles/tailwind.css";
import "../src/common/i18n";

const preview: Preview = {
	parameters: {
		actions: { argTypesRegex: "^on[A-Z].*" },
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/,
			},
		},
	},

	tags: ["autodocs"],
};

export default preview;
