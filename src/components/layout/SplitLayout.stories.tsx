import type { Meta, StoryObj } from "@storybook/react-vite";
import { SplitLayout } from "./SplitLayout";

const meta = { title: "Layout/Split layout", component: SplitLayout, args: { aside: <div className="h-full bg-steel-900 p-12 text-canvas">Brand panel</div>, children: <div>Primary content</div> } } satisfies Meta<typeof SplitLayout>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Desktop: Story = {};
export const Narrow: Story = { parameters: { viewport: { defaultViewport: "mobile1" } } };
