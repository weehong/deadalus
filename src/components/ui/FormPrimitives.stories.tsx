import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert } from "./Alert";
import { Field } from "./Field";
import { Input } from "./Input";

const meta = { title: "UI/Form primitives", component: Input } satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;
export const InputStates: Story = { render: () => <div className="grid max-w-sm gap-4"><Input placeholder="Default input" /><Input aria-invalid placeholder="Invalid input" /></div> };
export const FieldStates: Story = { render: () => <div className="grid max-w-sm gap-4"><Field id="name" label="Name"><Input /></Field><Field error="Name is required" id="invalid-name" label="Name"><Input /></Field></div> };
export const AlertState: Story = { render: () => <div className="max-w-sm"><Alert>Unable to complete the request.</Alert></div> };
