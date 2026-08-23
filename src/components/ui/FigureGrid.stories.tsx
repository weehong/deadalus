import type { Meta, StoryObj } from "@storybook/react-vite";
import { FigureGrid } from "./FigureGrid";

const meta = { title: "UI/Figure grid", component: FigureGrid, args: { figures: [{ label: "Sites", value: "12" }, { label: "Assets", value: "2.4k" }, { label: "Coverage", value: "24/7" }] }, decorators: [(Story) => <div className="bg-steel-900 p-8 text-canvas"><Story /></div>] } satisfies Meta<typeof FigureGrid>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
