import type { Meta, StoryObj } from "@storybook/react-vite";
import { BrandPanel } from "./BrandPanel";

const meta = { title: "Authentication/Brand panel", component: BrandPanel, args: { kicker: "Operations intelligence", headline: "Keep every site in working order.", blurb: "One operational view of work orders, asset health, and incident history across every site.", figures: [{ value: "12", label: "Sites" }, { value: "2.4k", label: "Assets" }, { value: "24/7", label: "Coverage" }] } } satisfies Meta<typeof BrandPanel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
