import type { Meta, StoryObj } from "@storybook/react-vite";
import { CatalogueItemsTable } from "@/features/projects/CatalogueItemsTable";
const meta = {
	title: "Projects/CatalogueItemsTable",
	component: CatalogueItemsTable,
	args: {
		catalogueItems: [
			{ id: "cabinet", name: "Kitchen cabinet", itemCount: 240 },
			{ id: "wardrobe", name: "Wardrobe", itemCount: 0 },
		],
	},
} satisfies Meta<typeof CatalogueItemsTable>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { catalogueItems: [] } };
export const WithActions: Story = {
	args: {
		renderActions: () => <button>Rename Catalogue Item</button>,
		footer: <form aria-label="Add Catalogue Item" className="p-3" />,
	},
};
